import RestaurantDetailClient from './RestaurantDetailClient'

interface RestaurantDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RestaurantDetailPage({ params }: RestaurantDetailPageProps) {
  const { id } = await params
  
  return <RestaurantDetailClient id={id} />
}