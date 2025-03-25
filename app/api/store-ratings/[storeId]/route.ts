import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { storeId: string } },
) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data, error } = await supabase.rpc('get_store_ratings', {
    p_store_id: params.storeId,
  })

  if (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 },
    )
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        average_rating: 0,
        total_ratings: 0,
        ratings: [],
      },
      { status: 200 },
    )
  }

  const {
    avg_rating: averageRating,
    total_ratings: totalRatings,
    ratings,
  } = data[0]

  return NextResponse.json(
    {
      average_rating: Number(averageRating) || 0,
      total_ratings: Number(totalRatings) || 0,
      ratings: Array.isArray(ratings) ? ratings : [],
    },
    { status: 200 },
  )
}
