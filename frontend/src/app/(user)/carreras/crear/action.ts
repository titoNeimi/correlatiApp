'use server'

import { DegreeData, CurriculumSubject } from './(types)/types';
import { ApiError, apiFetch, apiFetchJson } from '@/lib/api';

type fetchDegreeProgramsResponse = {
  count: number,
  data: University[]
}

export const fetchDegreePrograms = async (): Promise<fetchDegreeProgramsResponse> => {
  try {
    const data = await apiFetchJson<fetchDegreeProgramsResponse>('/universities')
    return data
  } catch (error) {
    console.log(error)
    return {count:0, data:[]}
  }
}

export const createUniversity = async (name: string): Promise<University | null> => {
  try {
    const response = await apiFetch('/universities', {
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
  const createdSubjectIds: string[] = []
  let createdProgramId: string | null = null

  const cleanupCreation = async () => {
    if (createdSubjectIds.length > 0) {
      await Promise.allSettled(
        createdSubjectIds.map((id) =>
          apiFetch(`/subjects/${id}`, { method: 'DELETE' })
        )
      )
    }
    if (createdProgramId) {
      await apiFetch(`/degreeProgram/${createdProgramId}`, {
        method: 'DELETE',
      })
    }
  }
  try {
    const response = await apiFetch('/degreeProgram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(degreeProgram)
    })
    if(!response.ok){
      return {ok:false, message: 'No se pudo crear la carrera'}
    }
    const createdProgram = await response.json()
    createdProgramId = createdProgram.id
    console.log('Carrera creada, creando subjects')
    const idMap = new Map<string, string>() // oldId -> newId

    for (const subject of subjects) {
      const subjectData = {
        name: subject.name,
        year: subject.year,
        subjectYear: subject.year,
        degreeProgramID: createdProgram.id,
      }
      const subjectResponse = await apiFetch('/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData)
      })
      if(!subjectResponse.ok){
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron crear todas las materias' }
      }
      const newSubjectData = await subjectResponse.json()
      createdSubjectIds.push(newSubjectData.id)
      idMap.set(subject.id, newSubjectData.id)
    }

    // Actualizar requirements con IDs nuevos
    for (const oldSubject of subjects) {
      if (!oldSubject.prerequisites || oldSubject.prerequisites.length === 0) continue;

      const newSubjectId = idMap.get(oldSubject.id)
      if (!newSubjectId) {
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron actualizar los requisitos' }
      }

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

      const updateResp = await apiFetch(`/subjects/${newSubjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      })
      if (!updateResp.ok) {
        console.log('No se pudo actualizar requirements de subject', newSubjectId)
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron actualizar los requisitos' }
      }
    }

    return {ok: true, message: 'Carrera creada correctamente'}
  } catch (error) {
    if (error instanceof ApiError && error.message.includes('NEXT_PUBLIC_APIURL')) {
      return { ok: false, message: 'NEXT_PUBLIC_APIURL no está configurada' }
    }
    console.log(error)
    await cleanupCreation()
    return { ok: false, message: 'Ocurrió un error al crear la carrera' }
  }
}
