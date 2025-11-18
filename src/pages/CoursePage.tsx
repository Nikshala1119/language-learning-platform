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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Course Header */}
      <div className="bg-primary/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-4">
            {currentCourse.thumbnail_url && (
              <img
                src={currentCourse.thumbnail_url}
                alt={currentCourse.title}
                className="w-32 h-32 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{currentCourse.title}</h1>
              <p className="text-muted-foreground mb-4">{currentCourse.description}</p>
              <div className="flex gap-2">
                <Badge>{currentCourse.language}</Badge>
                <Badge variant="outline">{currentCourse.level}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Units */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Course Units</h2>

        {units.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No units available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {units.map((unit, index) => (
              <Card key={unit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        Unit {index + 1}: {unit.title}
                      </CardTitle>
                      <CardDescription>{unit.description}</CardDescription>
                    </div>
                    <Button asChild>
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
