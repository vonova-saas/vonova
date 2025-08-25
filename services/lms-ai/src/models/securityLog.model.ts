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
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, required: true },
  userAgent: { type: String },
  method: { type: String, required: true },
  route: { type: String, required: true },
  attackType: { type: String, required: true },
  details: { type: Schema.Types.Mixed }
});

export default mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema); 