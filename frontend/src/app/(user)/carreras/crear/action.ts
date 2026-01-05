'use server'

import { DegreeData, CurriculumSubject } from './(types)/types';

type fetchDegreeProgramsResponse = {
  count: number,
  data: University[]
}

export const fetchDegreePrograms = async (): Promise<fetchDegreeProgramsResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APIURL}/universities`)

    if (!response.ok) {
      console.log("No se pudo obtener las universidades")
      return {count:0, data:[]}
    }

    return await response.json()
  } catch (error) {
    console.log(error)
    return {count:0, data:[]}
  }
}

export const createUniversity = async (name: string): Promise<University | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APIURL}/universities`, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if(!response.ok) {
      return null
    }
    const data = await response.json()
    console.log(data)
    return data
  } catch (error) {
    console.log(error)
    return null
  }
}

type subjectRequirement = {
  minStatus: minStatus,
  id: string
}

type minStatus ='passed' | 'final_pending'

export const confirmCreation = async (payload: { degreeData: DegreeData, subjects: CurriculumSubject[] }) => {
  const {degreeData, subjects} = payload
  const degreeProgram = {
    name: degreeData.degreeName,
    universityID: degreeData.universityId,
  }
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APIURL}/degreeProgram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(degreeProgram)
    })
    if(!response.ok){
      return {ok:false}
    }
    const degreeData = await response.json()
    console.log('Carrera creada, creando subjects')
    const newSubjects: CurriculumSubject[] = []
    const idMap = new Map<string, string>() // oldId -> newId

    for (const subject of subjects) {
      const subjectData = {
        name: subject.name,
        subjectYear: subject.year,
        degreeProgramID: degreeData.id,
      }
      const subjectResponse = await fetch(`${process.env.NEXT_PUBLIC_APIURL}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData)
      })
      if(!subjectResponse.ok){
        return { ok: false }
      }
      const newSubjectData = await subjectResponse.json()
      newSubjects.push(newSubjectData)
      idMap.set(subject.id, newSubjectData.id)
    }

    if (newSubjects.length != subjects.length){
      console.log(`no se pudo crear todas las subjects, error en la subject ${newSubjects.length}}`)
      //Borrar las subjects anteriores y el degreeProgram
      return { ok: false }
    }

    // Actualizar requirements con IDs nuevos
    for (const oldSubject of subjects) {
      if (!oldSubject.prerequisites || oldSubject.prerequisites.length === 0) continue;

      const newSubjectId = idMap.get(oldSubject.id)
      if (!newSubjectId) return { ok: false }

      const requirements = oldSubject.prerequisites.map<subjectRequirement>((req) => {
        const newReqId = idMap.get(req.subjectId)
        if (!newReqId) {
          throw new Error(`Requirement id ${req.subjectId} not found in new map`)
        }
        return {
          id: newReqId,
          minStatus: req.type === 'pending_final' ? 'final_pending' : 'passed'
        }
      })

      const updateBody = {
        requirements,
      }

      const updateResp = await fetch(`${process.env.NEXT_PUBLIC_APIURL}/subjects/${newSubjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      })
      if (!updateResp.ok) {
        console.log('No se pudo actualizar requirements de subject', newSubjectId)
        return { ok: false }
      }
    }

    return {ok: true}
  } catch (error) {
    console.log(error)
    return { ok: false }
  }
}
