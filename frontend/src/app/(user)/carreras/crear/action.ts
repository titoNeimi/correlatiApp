'use server'

import {
  DegreeData,
  CurriculumSubject,
  ElectivePoolDraft,
  ElectiveRuleDraft,
} from './(types)/types';
import { ApiError, apiFetch, apiFetchJson } from '@/lib/api';
import { cookies } from 'next/headers';

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

export const confirmCreation = async (payload: {
  degreeData: DegreeData;
  subjects: CurriculumSubject[];
  electivePools: ElectivePoolDraft[];
  electiveRules: ElectiveRuleDraft[];
}) => {
  const { degreeData, subjects, electivePools, electiveRules } = payload
  const cookieStore = cookies()
  const cookieHeader = cookieStore.toString()
  const authHeaders: Record<string, string> = cookieHeader ? { Cookie: cookieHeader } : {}
  const degreeProgram = {
    name: degreeData.degreeName,
    universityID: degreeData.universityId,
  }
  const createdSubjectIds: string[] = []
  let createdProgramId: string | null = null
  const createdPoolIds: string[] = []

  const cleanupCreation = async () => {
    if (createdSubjectIds.length > 0) {
      await Promise.allSettled(
        createdSubjectIds.map((id) =>
          apiFetch(`/subjects/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders,
          })
        )
      )
    }
    if (createdPoolIds.length > 0 && createdProgramId) {
      await Promise.allSettled(
        createdPoolIds.map((id) =>
          apiFetch(`/degreeProgram/${createdProgramId}/electivePools/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: authHeaders,
          })
        )
      )
    }
    if (createdProgramId) {
      await apiFetch(`/degreeProgram/${createdProgramId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders,
      })
    }
  }
  try {
    const response = await apiFetch('/degreeProgram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(degreeProgram),
      credentials: 'include',
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
        is_elective: subject.isElective ?? false,
      }
      const subjectResponse = await apiFetch('/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(subjectData),
        credentials: 'include',
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(updateBody),
        credentials: 'include',
      })
      if (!updateResp.ok) {
        console.log('No se pudo actualizar requirements de subject', newSubjectId)
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron actualizar los requisitos' }
      }
    }

    const poolIdMap = new Map<string, string>() // localPoolId -> createdPoolId
    for (const pool of electivePools) {
      const poolResponse = await apiFetch(`/degreeProgram/${createdProgram.id}/electivePools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          name: pool.name,
          description: pool.description,
        }),
        credentials: 'include',
      })
      if (!poolResponse.ok) {
        const errorBody = await poolResponse.text().catch(() => '')
        console.log('Pool create failed', poolResponse.status, errorBody)
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron crear los pools de electivas' }
      }
      const createdPool = await poolResponse.json()
      createdPoolIds.push(createdPool.id)
      poolIdMap.set(pool.id, createdPool.id)

      for (const subjectId of pool.subjectIds) {
        const newSubjectId = idMap.get(subjectId)
        if (!newSubjectId) {
          await cleanupCreation()
          return { ok: false, message: 'No se pudieron asignar electivas a pools' }
        }
        const linkResp = await apiFetch(
          `/degreeProgram/${createdProgram.id}/electivePools/${createdPool.id}/subjects`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ subject_id: newSubjectId }),
            credentials: 'include',
          }
        )
        if (!linkResp.ok) {
          const errorBody = await linkResp.text().catch(() => '')
          console.log('Pool subject link failed', linkResp.status, errorBody)
          await cleanupCreation()
          return { ok: false, message: 'No se pudieron asignar electivas a pools' }
        }
      }
    }

    for (const rule of electiveRules) {
      const createdPoolId = poolIdMap.get(rule.poolId)
      if (!createdPoolId) {
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron crear las reglas de electivas' }
      }
      const ruleResp = await apiFetch(`/degreeProgram/${createdProgram.id}/electiveRules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          pool_id: createdPoolId,
          applies_from_year: rule.appliesFromYear,
          applies_to_year: rule.appliesToYear ?? null,
          requirement_type: rule.requirementType,
          minimum_value: rule.minimumValue,
        }),
        credentials: 'include',
      })
      if (!ruleResp.ok) {
        const errorBody = await ruleResp.text().catch(() => '')
        console.log('Rule create failed', ruleResp.status, errorBody)
        await cleanupCreation()
        return { ok: false, message: 'No se pudieron crear las reglas de electivas' }
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
