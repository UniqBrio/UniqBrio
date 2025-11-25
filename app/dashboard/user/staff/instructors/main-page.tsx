import MainLayout from "@/components/dashboard/main-layout"
import InstructorListWithFilters from "@/components/dashboard/instructor/instructor-profile/InstructorListWithFilters"

export default function Home() {
  return (
    <MainLayout>
      <InstructorListWithFilters />
    </MainLayout>
  )
}
