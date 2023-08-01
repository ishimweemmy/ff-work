import { IAnnotation, IBoundingBoxData, IEllipseData, ILineData, IPolygonData } from '@/domains/annotations/model'
import { AnnotationTool } from '@/domains/labels/model'
import dataset from '@/routes/microservices/dataset'
import { fakerEN } from '@faker-js/faker'

export function generateAnnotationData (type: AnnotationTool): IAnnotation['data'] {
  const mapping: Record<AnnotationTool, () => IAnnotation['data']> = {
    boundingBox: (): IBoundingBoxData => {
      return {
        dimensions: Array.from({ length: 2 }, () => fakerEN.number.float({
          min: 0,
          max: 1,
        })) as [number, number],
        rotation: fakerEN.number.float({
          min: 0,
          max: 1,
        }),
        center: Array.from({ length: 2 }, () => fakerEN.number.float({
          min: 0,
          max: 1,
        })) as [number, number],
      }
    },
    ellipse: (): IEllipseData => {
      return {
        dimensions: Array.from({ length: 2 }, () => fakerEN.number.float({
          min: 0,
          max: 1,
        })) as [number, number],
        rotation: fakerEN.number.float({
          min: 0,
          max: 1,
        }),
        center: Array.from({ length: 2 }, () => fakerEN.number.float({
          min: 0,
          max: 1,
        })) as [number, number],
      }
    },
    line: (): ILineData => {
      return {
        points: Array.from({ length: 2 }, () => {
          return Array.from({ length: 2 }, () => fakerEN.number.float({
            min: 0,
            max: 1,
          }))
        }) as [[number, number], [number, number]]
      }
    },
    polygon: (): IPolygonData => {
      return {
        points: Array.from({ length: 5 }, () => {
          return Array.from({ length: 2 }, () => fakerEN.number.float({
            min: 0,
            max: 1,
          }))
        }) as [number, number][]
      }
    }
  }
  return mapping[type]()
}