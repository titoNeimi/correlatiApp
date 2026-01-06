import { Subjects } from "react-hook-form"
import { DegreeProgram } from "./degreeProgram"

export type UserDegreeProgram = Pick<DegreeProgram, "id" | "name"> & Partial<DegreeProgram>

export type User = {
  id:string,
  email: string,
  degreePrograms: UserDegreeProgram[],
  subjects: Subjects[],
  role: UserRole,
  created_at: string,
  updated_at: string
}

export type UserRole = 'admin' | 'user' | 'staff'
