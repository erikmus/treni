/**
 * FIT File Generator for Workout Files
 * 
 * FIT (Flexible and Interoperable Data Transfer) is Garmin's binary file format.
 * This module creates Workout FIT files that can be uploaded to Garmin Connect
 * and synced to Garmin devices.
 * 
 * References:
 * - FIT SDK: https://developer.garmin.com/fit/protocol/
 * - Workout file type: Contains workout steps that guide training sessions
 */

// FIT Protocol constants
const FIT_PROTOCOL_VERSION = 0x20; // 2.0
const FIT_PROFILE_VERSION = 0x0815; // 21.21

// Message types
const MESG_NUM = {
  FILE_ID: 0,
  WORKOUT: 26,
  WORKOUT_STEP: 27,
};

// Field definitions
const FILE_TYPE = {
  WORKOUT: 5,
};

const SPORT = {
  RUNNING: 1,
};

const SUB_SPORT = {
  GENERIC: 0,
};

const WORKOUT_STEP_DURATION = {
  TIME: 0,
  DISTANCE: 1,
  OPEN: 3,
  REPEAT_UNTIL_STEPS_CMPLT: 6,
};

const WORKOUT_STEP_TARGET = {
  SPEED: 0,
  HEART_RATE: 1,
  OPEN: 2,
  PACE: 6,
};

const INTENSITY = {
  ACTIVE: 0,
  REST: 1,
  WARMUP: 2,
  COOLDOWN: 3,
  RECOVERY: 4,
  INTERVAL: 5,
};

interface WorkoutSegment {
  type: string;
  name: string;
  duration_type?: string;
  duration_value?: number;
  target_type?: string;
  target_pace_low?: number;
  target_pace_high?: number;
  target_zone?: number;
  repeat_count?: number;
  segments?: WorkoutSegment[];
  notes?: string;
}

interface WorkoutStructure {
  segments: WorkoutSegment[];
  estimated_duration_minutes: number;
  estimated_distance_km: number;
}

interface WorkoutData {
  title: string;
  workout_type: string;
  workout_structure: WorkoutStructure | null;
  target_duration_minutes: number | null;
  target_distance_km: number | null;
}

/**
 * Create a FIT workout file from workout data
 */
export function createWorkoutFit(workout: WorkoutData): Buffer {
  const writer = new FitWriter();
  
  // Write file header (will be updated at the end with correct data size)
  const headerPosition = writer.position;
  writer.writeHeader();
  
  // Write File ID message
  writer.writeFileIdMessage();
  
  // Write Workout message
  writer.writeWorkoutMessage(workout.title);
  
  // Write Workout Steps
  let stepIndex = 0;
  
  if (workout.workout_structure?.segments) {
    for (const segment of workout.workout_structure.segments) {
      stepIndex = writer.writeWorkoutStep(segment, stepIndex);
    }
  } else {
    // Create a simple workout if no structure is defined
    stepIndex = writer.writeSimpleWorkoutSteps(workout, stepIndex);
  }
  
  // Calculate CRC and update header
  writer.finalize();
  
  return writer.getBuffer();
}

class FitWriter {
  private buffer: number[] = [];
  private _position = 0;
  private localMessageTypes: Map<number, number> = new Map();
  
  get position(): number {
    return this._position;
  }
  
  writeHeader(): void {
    // Header size (14 bytes for FIT files with CRC)
    this.writeByte(14);
    // Protocol version
    this.writeByte(FIT_PROTOCOL_VERSION);
    // Profile version (little endian)
    this.writeUInt16LE(FIT_PROFILE_VERSION);
    // Data size placeholder (will be updated)
    this.writeUInt32LE(0);
    // ".FIT" signature
    this.writeBytes([0x2E, 0x46, 0x49, 0x54]);
    // Header CRC placeholder
    this.writeUInt16LE(0);
  }
  
  writeFileIdMessage(): void {
    // Definition message for File ID
    this.writeDefinitionMessage(MESG_NUM.FILE_ID, 0, [
      { fieldNum: 0, size: 1, baseType: 0 }, // type
      { fieldNum: 1, size: 2, baseType: 132 }, // manufacturer
      { fieldNum: 2, size: 2, baseType: 132 }, // product
      { fieldNum: 3, size: 4, baseType: 134 }, // serial_number
      { fieldNum: 4, size: 4, baseType: 134 }, // time_created
    ]);
    
    // Data message
    this.writeDataMessageHeader(0);
    this.writeByte(FILE_TYPE.WORKOUT); // type = workout
    this.writeUInt16LE(1); // manufacturer = Garmin
    this.writeUInt16LE(1); // product
    this.writeUInt32LE(12345); // serial_number
    this.writeUInt32LE(Math.floor(Date.now() / 1000) - 631065600); // time_created (FIT timestamp)
  }
  
  writeWorkoutMessage(name: string): void {
    const nameBytes = this.stringToBytes(name, 64);
    
    // Definition message for Workout
    this.writeDefinitionMessage(MESG_NUM.WORKOUT, 1, [
      { fieldNum: 4, size: 1, baseType: 0 }, // sport
      { fieldNum: 5, size: 1, baseType: 0 }, // sub_sport
      { fieldNum: 6, size: 2, baseType: 132 }, // num_valid_steps
      { fieldNum: 8, size: nameBytes.length, baseType: 7 }, // wkt_name (string)
    ]);
    
    // Data message
    this.writeDataMessageHeader(1);
    this.writeByte(SPORT.RUNNING); // sport
    this.writeByte(SUB_SPORT.GENERIC); // sub_sport
    this.writeUInt16LE(10); // num_valid_steps (will be accurate enough)
    this.writeBytes(nameBytes); // wkt_name
  }
  
  writeWorkoutStep(segment: WorkoutSegment, stepIndex: number): number {
    const localMsgType = 2;
    
    // Handle repeat blocks
    if (segment.type === "repeat" && segment.segments && segment.repeat_count) {
      const startStep = stepIndex;
      
      // Write nested segments
      for (const nested of segment.segments) {
        stepIndex = this.writeWorkoutStep(nested, stepIndex);
      }
      
      // Write repeat step
      this.writeStepDefinition(localMsgType);
      this.writeDataMessageHeader(localMsgType);
      
      this.writeUInt16LE(stepIndex); // message_index
      this.writeByte(WORKOUT_STEP_DURATION.REPEAT_UNTIL_STEPS_CMPLT); // duration_type
      this.writeUInt32LE(startStep); // duration_value (target step to return to)
      this.writeByte(WORKOUT_STEP_TARGET.OPEN); // target_type
      this.writeUInt32LE(0); // target_value
      this.writeUInt32LE(0); // custom_target_value_low
      this.writeUInt32LE(segment.repeat_count); // custom_target_value_high (repeat count)
      this.writeByte(INTENSITY.INTERVAL); // intensity
      
      return stepIndex + 1;
    }
    
    // Regular step
    this.writeStepDefinition(localMsgType);
    this.writeDataMessageHeader(localMsgType);
    
    // Determine duration
    let durationType = WORKOUT_STEP_DURATION.OPEN;
    let durationValue = 0;
    
    if (segment.duration_type === "time" && segment.duration_value) {
      durationType = WORKOUT_STEP_DURATION.TIME;
      durationValue = segment.duration_value * 1000; // Convert to milliseconds
    } else if (segment.duration_type === "distance" && segment.duration_value) {
      durationType = WORKOUT_STEP_DURATION.DISTANCE;
      durationValue = segment.duration_value * 100; // Convert to centimeters
    }
    
    // Determine target
    let targetType = WORKOUT_STEP_TARGET.OPEN;
    let targetLow = 0;
    let targetHigh = 0;
    
    if (segment.target_type === "pace" || (segment.target_pace_low || segment.target_pace_high)) {
      targetType = WORKOUT_STEP_TARGET.PACE;
      // FIT pace is in mm/s, we have sec/km
      // Convert: pace (s/km) -> speed (m/s) -> speed (mm/s)
      if (segment.target_pace_low) {
        targetHigh = Math.round((1000 / segment.target_pace_low) * 1000);
      }
      if (segment.target_pace_high) {
        targetLow = Math.round((1000 / segment.target_pace_high) * 1000);
      }
    } else if (segment.target_type === "heart_rate_zone" && segment.target_zone) {
      targetType = WORKOUT_STEP_TARGET.HEART_RATE;
      // Heart rate zones as percentage of max HR
      const zoneRanges: Record<number, [number, number]> = {
        1: [50, 60],
        2: [60, 70],
        3: [70, 80],
        4: [80, 90],
        5: [90, 100],
      };
      const range = zoneRanges[segment.target_zone] || [50, 100];
      targetLow = range[0] + 100; // FIT encodes HR zones as percentage + 100
      targetHigh = range[1] + 100;
    }
    
    // Determine intensity
    let intensity = INTENSITY.ACTIVE;
    switch (segment.type) {
      case "warmup":
        intensity = INTENSITY.WARMUP;
        break;
      case "cooldown":
        intensity = INTENSITY.COOLDOWN;
        break;
      case "recovery":
        intensity = INTENSITY.RECOVERY;
        break;
      case "interval":
        intensity = INTENSITY.INTERVAL;
        break;
      case "rest":
        intensity = INTENSITY.REST;
        break;
    }
    
    this.writeUInt16LE(stepIndex); // message_index
    this.writeByte(durationType); // duration_type
    this.writeUInt32LE(durationValue); // duration_value
    this.writeByte(targetType); // target_type
    this.writeUInt32LE(targetLow); // target_value / custom_target_value_low
    this.writeUInt32LE(targetHigh); // custom_target_value_high
    this.writeByte(intensity); // intensity
    
    return stepIndex + 1;
  }
  
  writeSimpleWorkoutSteps(workout: WorkoutData, stepIndex: number): number {
    const localMsgType = 2;
    
    // Warmup (10% of duration)
    const warmupDuration = Math.round((workout.target_duration_minutes || 30) * 0.1 * 60 * 1000);
    this.writeStepDefinition(localMsgType);
    this.writeDataMessageHeader(localMsgType);
    this.writeUInt16LE(stepIndex++);
    this.writeByte(WORKOUT_STEP_DURATION.TIME);
    this.writeUInt32LE(warmupDuration);
    this.writeByte(WORKOUT_STEP_TARGET.OPEN);
    this.writeUInt32LE(0);
    this.writeUInt32LE(0);
    this.writeByte(INTENSITY.WARMUP);
    
    // Main workout (80% of duration)
    const mainDuration = Math.round((workout.target_duration_minutes || 30) * 0.8 * 60 * 1000);
    this.writeStepDefinition(localMsgType);
    this.writeDataMessageHeader(localMsgType);
    this.writeUInt16LE(stepIndex++);
    this.writeByte(WORKOUT_STEP_DURATION.TIME);
    this.writeUInt32LE(mainDuration);
    this.writeByte(WORKOUT_STEP_TARGET.OPEN);
    this.writeUInt32LE(0);
    this.writeUInt32LE(0);
    this.writeByte(INTENSITY.ACTIVE);
    
    // Cooldown (10% of duration)
    const cooldownDuration = Math.round((workout.target_duration_minutes || 30) * 0.1 * 60 * 1000);
    this.writeStepDefinition(localMsgType);
    this.writeDataMessageHeader(localMsgType);
    this.writeUInt16LE(stepIndex++);
    this.writeByte(WORKOUT_STEP_DURATION.TIME);
    this.writeUInt32LE(cooldownDuration);
    this.writeByte(WORKOUT_STEP_TARGET.OPEN);
    this.writeUInt32LE(0);
    this.writeUInt32LE(0);
    this.writeByte(INTENSITY.COOLDOWN);
    
    return stepIndex;
  }
  
  private writeStepDefinition(localMsgType: number): void {
    if (!this.localMessageTypes.has(localMsgType)) {
      this.writeDefinitionMessage(MESG_NUM.WORKOUT_STEP, localMsgType, [
        { fieldNum: 254, size: 2, baseType: 132 }, // message_index
        { fieldNum: 0, size: 1, baseType: 0 }, // duration_type
        { fieldNum: 1, size: 4, baseType: 134 }, // duration_value
        { fieldNum: 2, size: 1, baseType: 0 }, // target_type
        { fieldNum: 3, size: 4, baseType: 134 }, // target_value / custom_target_value_low
        { fieldNum: 4, size: 4, baseType: 134 }, // custom_target_value_high
        { fieldNum: 5, size: 1, baseType: 0 }, // intensity
      ]);
      this.localMessageTypes.set(localMsgType, MESG_NUM.WORKOUT_STEP);
    }
  }
  
  private writeDefinitionMessage(
    globalMsgNum: number,
    localMsgType: number,
    fields: Array<{ fieldNum: number; size: number; baseType: number }>
  ): void {
    // Record header (definition message)
    this.writeByte(0x40 | localMsgType);
    // Reserved
    this.writeByte(0);
    // Architecture (0 = little endian)
    this.writeByte(0);
    // Global message number
    this.writeUInt16LE(globalMsgNum);
    // Number of fields
    this.writeByte(fields.length);
    
    // Field definitions
    for (const field of fields) {
      this.writeByte(field.fieldNum);
      this.writeByte(field.size);
      this.writeByte(field.baseType);
    }
    
    this.localMessageTypes.set(localMsgType, globalMsgNum);
  }
  
  private writeDataMessageHeader(localMsgType: number): void {
    this.writeByte(localMsgType);
  }
  
  finalize(): void {
    // Calculate data size (everything after header, before CRC)
    const dataSize = this.buffer.length - 14;
    
    // Update data size in header
    this.buffer[4] = dataSize & 0xFF;
    this.buffer[5] = (dataSize >> 8) & 0xFF;
    this.buffer[6] = (dataSize >> 16) & 0xFF;
    this.buffer[7] = (dataSize >> 24) & 0xFF;
    
    // Calculate and write header CRC (bytes 0-11)
    const headerCrc = this.calculateCrc(this.buffer.slice(0, 12));
    this.buffer[12] = headerCrc & 0xFF;
    this.buffer[13] = (headerCrc >> 8) & 0xFF;
    
    // Calculate and write file CRC
    const fileCrc = this.calculateCrc(this.buffer);
    this.writeByte(fileCrc & 0xFF);
    this.writeByte((fileCrc >> 8) & 0xFF);
  }
  
  getBuffer(): Buffer {
    return Buffer.from(this.buffer);
  }
  
  private writeByte(value: number): void {
    this.buffer.push(value & 0xFF);
    this._position++;
  }
  
  private writeBytes(values: number[]): void {
    for (const v of values) {
      this.writeByte(v);
    }
  }
  
  private writeUInt16LE(value: number): void {
    this.writeByte(value & 0xFF);
    this.writeByte((value >> 8) & 0xFF);
  }
  
  private writeUInt32LE(value: number): void {
    this.writeByte(value & 0xFF);
    this.writeByte((value >> 8) & 0xFF);
    this.writeByte((value >> 16) & 0xFF);
    this.writeByte((value >> 24) & 0xFF);
  }
  
  private stringToBytes(str: string, maxLength: number): number[] {
    const bytes: number[] = [];
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str.substring(0, maxLength - 1));
    
    for (const byte of encoded) {
      bytes.push(byte);
    }
    
    // Null terminate
    bytes.push(0);
    
    // Pad to fixed length if needed
    while (bytes.length < maxLength) {
      bytes.push(0);
    }
    
    return bytes.slice(0, maxLength);
  }
  
  private calculateCrc(data: number[]): number {
    const crcTable = [
      0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
      0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
    ];
    
    let crc = 0;
    
    for (const byte of data) {
      // Lower nibble
      let tmp = crcTable[crc & 0x0F];
      crc = (crc >> 4) & 0x0FFF;
      crc = crc ^ tmp ^ crcTable[byte & 0x0F];
      
      // Upper nibble
      tmp = crcTable[crc & 0x0F];
      crc = (crc >> 4) & 0x0FFF;
      crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0x0F];
    }
    
    return crc;
  }
}

