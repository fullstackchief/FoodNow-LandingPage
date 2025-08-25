import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import SearchResultsPage from '@/components/pages/SearchResults'

export default function RestaurantBrowsePage() {
  return (
    <>
      <Navigation />
      <div className="pt-20">
        <SearchResultsPage />
      </div>
      <Footer />
    </>
  )
}