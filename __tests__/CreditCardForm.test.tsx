import { render, screen, fireEvent, act } from '@testing-library/react'
import { CreditCardForm } from '@/components/CheckoutPaymentForm/CreditCardForm'
import { PagBankService } from '@/services/pagbank'

// Mock do PagBankService
jest.mock('@/services/pagbank', () => ({
  PagBankService: {
    getInstance: jest.fn(() => ({
      createCardToken: jest.fn().mockResolvedValue('mock-token-123'),
    })),
  },
}))

// Mock do fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        paymentStatus: 'PAID',
        order: { id: '123' },
      }),
  }),
) as jest.Mock

// Mock do contexto com dados necessários
const mockContextData = {
  order: {
    id: '123',
    total_amount: 100,
    status: 'pending',
    items: [],
    discount_amount: 0,
  },
  setFormData: jest.fn(),
  setSubmitForm: jest.fn(),
  setIsFormValid: jest.fn(),
  setPaymentStatus: jest.fn(),
  setPaymentMessage: jest.fn(),
  finalAmount: 100,
  isLoading: false,
}

// Mock do PaymentContext
jest.mock('@/contexts/PaymentContext', () => ({
  ...jest.requireActual('@/contexts/PaymentContext'),
  usePayment: () => mockContextData,
}))

describe('CreditCardForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar todos os campos do formulário', () => {
    render(<CreditCardForm />)

    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/DDD/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Número do cartão/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Validade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CVV/i)).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    render(<CreditCardForm />)

    // Simula mudança em todos os campos e depois limpa
    await act(async () => {
      const fields = [
        'Nome completo',
        'Email',
        'CPF',
        'DDD',
        'Telefone',
        'Número do cartão',
        'Validade',
        'CVV',
      ]

      for (const field of fields) {
        const input = screen.getByLabelText(new RegExp(field, 'i'))
        fireEvent.change(input, { target: { value: 'test' } })
        await new Promise((resolve) => setTimeout(resolve, 0))
        fireEvent.blur(input)
        await new Promise((resolve) => setTimeout(resolve, 0))
        fireEvent.change(input, { target: { value: '' } })
        await new Promise((resolve) => setTimeout(resolve, 0))
        fireEvent.blur(input)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    })

    // Verifica se o formulário é inválido
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockContextData.setIsFormValid).toHaveBeenCalledWith(false)
  })

  it('deve aceitar um formulário válido', async () => {
    // Mock do PagBankService para retornar sucesso
    const mockPagBankService = {
      createCardToken: jest.fn().mockResolvedValue('mock-token-123'),
    }
    jest
      .spyOn(PagBankService, 'getInstance')
      .mockImplementation(() => mockPagBankService)

    render(<CreditCardForm />)

    // Preenche os campos
    await act(async () => {
      const fieldsData = {
        'Nome completo': 'João Silva',
        Email: 'joao@example.com',
        CPF: '12345678900',
        DDD: '11',
        Telefone: '999999999',
        'Número do cartão': '4111111111111111',
        Validade: '1225',
        CVV: '123',
      }

      for (const [field, value] of Object.entries(fieldsData)) {
        const input = screen.getByLabelText(new RegExp(field, 'i'))
        fireEvent.change(input, { target: { value } })
        await new Promise((resolve) => setTimeout(resolve, 0))
        fireEvent.blur(input)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      // Simula um pequeno atraso para a validação
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Simula o envio do formulário
      const submitHandler = mockContextData.setSubmitForm.mock.calls[0][0]
      await submitHandler()
    })

    // Verifica se o formulário é válido e o pagamento foi processado
    expect(mockContextData.setIsFormValid).toHaveBeenCalledWith(true)
    expect(mockContextData.setPaymentStatus).toHaveBeenCalledWith('success')
  })

  it('deve lidar com erro na criação do token do cartão', async () => {
    // Mock do PagBankService para retornar erro
    const mockError = new Error('Erro ao gerar token')
    const mockPagBankService = {
      createCardToken: jest.fn().mockRejectedValue(mockError),
    }
    jest
      .spyOn(PagBankService, 'getInstance')
      .mockImplementation(() => mockPagBankService)

    render(<CreditCardForm />)

    // Preenche os campos com dados válidos
    await act(async () => {
      const fieldsData = {
        'Nome completo': 'João Silva',
        Email: 'joao@example.com',
        CPF: '12345678900',
        DDD: '11',
        Telefone: '999999999',
        'Número do cartão': '4111111111111111',
        Validade: '1225',
        CVV: '123',
      }

      for (const [field, value] of Object.entries(fieldsData)) {
        const input = screen.getByLabelText(new RegExp(field, 'i'))
        fireEvent.change(input, { target: { value } })
        await new Promise((resolve) => setTimeout(resolve, 0))
        fireEvent.blur(input)
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      // Simula um pequeno atraso para a validação
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Simula o envio do formulário
      const submitHandler = mockContextData.setSubmitForm.mock.calls[0][0]
      await submitHandler()
    })

    // Verifica se o erro foi tratado
    expect(mockContextData.setPaymentStatus).toHaveBeenCalledWith('error')
  })
})
