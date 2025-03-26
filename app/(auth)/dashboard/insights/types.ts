/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DetailedInsight {
  insight_type: string
  title: string
  description: string
  metric_value: number
  trend_percentage: number
  additional_info: any
}

export interface StoreInsights {
  metrics: {
    total_orders: number
    total_revenue: number
    average_order_value: number
    total_products: number
    top_products: {
      id: string
      name: string
      image_url: string
      total_sales: number
      total_revenue: number
    }[]
    sales_by_day: {
      date: string
      total: number
    }[]
  }
  insights: {
    insight_type: string
    title: string
    description: string
    metric_value: number
    trend_percentage: number
  }[]
  ratings: {
    avg_rating: number
    total_ratings: number
    ratings: {
      id: string
      rating: number
      food_rating: number
      delivery_rating: number
      comment: string | null
      created_at: string
      user: {
        name: string
        avatar_url: string | null
        email: string
      }
    }[]
  }
  topCustomers: {
    email: string
    orders: number
    total_spent: number
  }[]
  detailedInsights: {
    paymentMethods: DetailedInsight[]
    couponUsage: DetailedInsight[]
    priceImpact: any[]
    raw: DetailedInsight[]
  }
}
