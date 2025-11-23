import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCourseStore } from '@/store/courseStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { currentCourse, units, fetchCourse, fetchUnits } = useCourseStore()

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId)
      fetchUnits(courseId)
    }
  }, [courseId, fetchCourse, fetchUnits])

  if (!currentCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">Course</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Course Header */}
      <div className="bg-primary/10 border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            {currentCourse.thumbnail_url && (
              <img
                src={currentCourse.thumbnail_url}
                alt={currentCourse.title}
                className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{currentCourse.title}</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
                {currentCourse.description}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge className="text-xs sm:text-sm">{currentCourse.language}</Badge>
                <Badge variant="outline" className="text-xs sm:text-sm">{currentCourse.level}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Units */}
      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6">Course Units</h2>

        {units.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <p className="text-sm text-muted-foreground">No units available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {units.map((unit, index) => (
              <Card key={unit.id}>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg">
                        Unit {index + 1}: {unit.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        {unit.description}
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" className="w-full sm:w-auto flex-shrink-0">
                      <Link to={`/unit/${unit.id}`}>Start</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
