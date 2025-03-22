'use client'

/* eslint-disable no-use-before-define */

interface PagSeguroSDK {
  encryptCard: (data: {
    publicKey: string
    holder: string
    number: string
    expMonth: string
    expYear: string
    securityCode: string
  }) => {
    encryptedCard: string
    hasErrors: boolean
    errors: Array<{
      code: string
      message: string
    }>
  }
}

declare global {
  interface Window {
    PagSeguro: PagSeguroSDK
  }
}

interface CardData {
  number: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  holder: string
}

export class PagBankService {
  private static instance: PagBankService

  // private constructor() {}

  public static getInstance(): PagBankService {
    if (!PagBankService.instance) {
      PagBankService.instance = new PagBankService()
    }
    return PagBankService.instance
  }

  public async createCardToken(cardData: CardData): Promise<string> {
    try {
      if (typeof window === 'undefined' || !window.PagSeguro?.encryptCard) {
        throw new Error('SDK do PagBank não está disponível')
      }

      const result = window.PagSeguro.encryptCard({
        publicKey: process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY || '',
        holder: cardData.holder,
        number: cardData.number.replace(/\s/g, ''),
        expMonth: cardData.expiryMonth,
        expYear: cardData.expiryYear,
        securityCode: cardData.cvv,
      })

      if (result.hasErrors) {
        console.error('Erros na criptografia:', result.errors)
        throw new Error(
          result.errors[0]?.message || 'Erro ao criptografar cartão',
        )
      }

      return result.encryptedCard
    } catch (error) {
      console.error('Erro ao criptografar cartão:', error)
      throw new Error('Falha ao processar dados do cartão')
    }
  }
}
