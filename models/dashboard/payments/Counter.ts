import mongoose from 'mongoose';

export interface ICounter extends mongoose.Document {
  _id: string;
  sequenceValue: number;
}

export interface ICounterModel extends mongoose.Model<ICounter> {
  getNextSequence(name: string): Promise<number>;
}

const CounterSchema = new mongoose.Schema<ICounter>({
  _id: {
    type: String,
    required: true,
  },
  sequenceValue: {
    type: Number,
    default: 0,
  },
});

// Static method to get next sequence number
CounterSchema.statics.getNextSequence = async function (name: string) {
  const counter = await this.findByIdAndUpdate(
    { _id: name },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
};

// Delete cached model to ensure schema updates are picked up
if (mongoose.models.Counter) {
  delete mongoose.models.Counter;
}

const CounterModel = mongoose.model<ICounter, ICounterModel>('Counter', CounterSchema);

export default CounterModel;
