import { render, screen, fireEvent } from '@testing-library/react'
import CheckoutPayment from '@/components/CheckoutPayment'

// Mock do contexto com dados necessários
const mockContextData = {
  paymentMethod: 'credit_card',
  setPaymentMethod: jest.fn(),
  order: {
    id: '123',
    total_amount: 100,
    status: 'pending',
    items: [],
    discount_amount: 0,
  },
  finalAmount: 100,
  isLoading: false,
}

// Mock do PaymentContext
jest.mock('@/contexts/PaymentContext', () => ({
  ...jest.requireActual('@/contexts/PaymentContext'),
  usePayment: () => mockContextData,
}))

describe('CheckoutPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar os métodos de pagamento', () => {
    render(<CheckoutPayment />)

    expect(screen.getByText(/Cartão de crédito/i)).toBeInTheDocument()
    expect(screen.getByText(/Pix/i)).toBeInTheDocument()
  })

  it('deve mostrar o preço correto para pagamento com cartão de crédito', () => {
    render(<CheckoutPayment />)

    expect(screen.getByText('R$ 100.00')).toBeInTheDocument()
  })

  it('deve mostrar o preço com desconto para pagamento com PIX', () => {
    mockContextData.paymentMethod = 'pix'
    mockContextData.finalAmount = 95 // 5% de desconto

    render(<CheckoutPayment />)

    expect(screen.getByText('R$ 95.00')).toBeInTheDocument()
  })

  it('deve mudar o método de pagamento ao clicar', () => {
    render(<CheckoutPayment />)

    const pixButton = screen.getByText(/Pix/i)
    fireEvent.click(pixButton)

    expect(mockContextData.setPaymentMethod).toHaveBeenCalledWith('PIX')
  })
})
