import mongoose, { HydratedDocument } from 'mongoose'

export interface IPaymentMethod {
  owner: mongoose.Types.ObjectId,
  cardNumber: string,
  cardExpirationDate: {
    month: number,
    year: number,
  }
  cardHolderName: string,
  cvv: string,
}

const PaymentMethodSchema = new mongoose.Schema<IPaymentMethod>({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  cardNumber: {
    type: String,
    required: true,
  },
  cardExpirationDate: {
    type: {
      month: {
        type: Number,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      }
    },
    required: true,
  },
  cardHolderName: {
    type: String,
    required: true,
  },
  cvv: {
    type: String,
    required: function (this: HydratedDocument<IPaymentMethod>) {
      const cvvCode = this.cvv
      return /^\d{3}$/.test(cvvCode)
    }
  }
})

const PaymentMethod = mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema)

export default PaymentMethod
