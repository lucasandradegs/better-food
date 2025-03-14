import { render, screen, fireEvent, act } from '@testing-library/react'
import { PixForm } from '@/components/CheckoutPaymentForm/PixForm'

// Mock do fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        qrCode: 'mock-qr-code',
        qrCodeImage: 'mock-qr-code-image',
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

describe('PixForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar todos os campos do formulário', () => {
    render(<PixForm />)

    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    render(<PixForm />)

    // Simula mudança em todos os campos e depois limpa
    await act(async () => {
      const fields = ['Nome completo', 'Email', 'CPF']

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
    render(<PixForm />)

    // Preenche os campos
    await act(async () => {
      const fieldsData = {
        'Nome completo': 'João Silva',
        Email: 'joao@example.com',
        CPF: '12345678900',
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

  it('deve gerar QR code com sucesso', async () => {
    render(<PixForm />)

    // Preenche os campos com dados válidos
    await act(async () => {
      const fieldsData = {
        'Nome completo': 'João Silva',
        Email: 'joao@example.com',
        CPF: '12345678900',
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

    // Verifica se o QR code foi gerado com sucesso
    expect(mockContextData.setPaymentStatus).toHaveBeenCalledWith('success')
  })

  it('deve lidar com erro na geração do QR code', async () => {
    // Mock do fetch com erro
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Erro ao gerar QR code')),
    ) as jest.Mock

    render(<PixForm />)

    // Preenche os campos com dados válidos
    await act(async () => {
      const fieldsData = {
        'Nome completo': 'João Silva',
        Email: 'joao@example.com',
        CPF: '12345678900',
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
