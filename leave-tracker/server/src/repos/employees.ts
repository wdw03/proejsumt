import { Db } from '../db';
import { Employee } from '../types';

export async function listEmployees(db: Db): Promise<Employee[]> {
  return db.all<Employee>('SELECT id, name, team FROM employees ORDER BY name');
}

export async function findEmployee(db: Db, id: number): Promise<Employee | undefined> {
  return db.get<Employee>('SELECT id, name, team FROM employees WHERE id = ?', [id]);
}
