import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityLog extends Document {
  timestamp: Date;
  ip: string;
  userAgent?: string;
  method: string;
  route: string;
  attackType: string;
  details?: any;
}

const SecurityLogSchema = new Schema<ISecurityLog>({
  timestamp: { type: Date, default: Date.now, index: true },
  ip: { type: String, required: true, index: true },
  userAgent: { type: String },
  method: { type: String, required: true },
  route: { type: String, required: true, index: true },
  attackType: { type: String, required: true, index: true },
  details: { type: Schema.Types.Mixed }
});

// Indexes for better query performance
SecurityLogSchema.index({ timestamp: -1, attackType: 1 });
SecurityLogSchema.index({ ip: 1, timestamp: -1 });

export default mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
