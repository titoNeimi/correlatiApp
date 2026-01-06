import { Subjects } from "react-hook-form"
import { DegreeProgram } from "./degreeProgram"

export type User = {
  id:string,
  email: string,
  degreePrograms: DegreeProgram[],
  subjects: Subjects[],
  role: UserRole,
  created_at: string,
  updated_at: string
}

export type UserRole = 'admin' | 'user' | 'staff'