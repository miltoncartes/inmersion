export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      buzo: {
        Row: {
          clase_matricula: string | null
          created_at: string
          estado: string
          id_buzo: string
          nombre_buzo: string
          rut_buzo: string
          updated_at: string
          vencimiento_hipervarico: string | null
        }
        Insert: {
          clase_matricula?: string | null
          created_at?: string
          estado?: string
          id_buzo?: string
          nombre_buzo: string
          rut_buzo: string
          updated_at?: string
          vencimiento_hipervarico?: string | null
        }
        Update: {
          clase_matricula?: string | null
          created_at?: string
          estado?: string
          id_buzo?: string
          nombre_buzo?: string
          rut_buzo?: string
          updated_at?: string
          vencimiento_hipervarico?: string | null
        }
        Relationships: []
      }
      cliente: {
        Row: {
          created_at: string
          id_cliente: string
          nombre_cliente: string
          observacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id_cliente?: string
          nombre_cliente: string
          observacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id_cliente?: string
          nombre_cliente?: string
          observacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipos: {
        Row: {
          created_at: string
          matricula_equipo: string | null
          numero_serie_ordenador: string
          tipo_equipo_buceo: string
          updated_at: string
          vencimiento_equipo: string | null
        }
        Insert: {
          created_at?: string
          matricula_equipo?: string | null
          numero_serie_ordenador: string
          tipo_equipo_buceo: string
          updated_at?: string
          vencimiento_equipo?: string | null
        }
        Update: {
          created_at?: string
          matricula_equipo?: string | null
          numero_serie_ordenador?: string
          tipo_equipo_buceo?: string
          updated_at?: string
          vencimiento_equipo?: string | null
        }
        Relationships: []
      }
      perfil_inmersion: {
        Row: {
          created_at: string
          created_by: string | null
          estado_mar: string | null
          faena_realizada: string | null
          fecha_inmersion: string
          hora_dejo_fondo: string | null
          hora_dejo_superficie: string | null
          hora_llego_fondo: string | null
          hora_llego_superficie: string | null
          id_buzo: string
          id_cliente: string | null
          id_inmersion: string
          id_supervisor: string | null
          numero_serie_ordenador: string | null
          temperatura_agua: number | null
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado_mar?: string | null
          faena_realizada?: string | null
          fecha_inmersion: string
          hora_dejo_fondo?: string | null
          hora_dejo_superficie?: string | null
          hora_llego_fondo?: string | null
          hora_llego_superficie?: string | null
          id_buzo: string
          id_cliente?: string | null
          id_inmersion?: string
          id_supervisor?: string | null
          numero_serie_ordenador?: string | null
          temperatura_agua?: number | null
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado_mar?: string | null
          faena_realizada?: string | null
          fecha_inmersion?: string
          hora_dejo_fondo?: string | null
          hora_dejo_superficie?: string | null
          hora_llego_fondo?: string | null
          hora_llego_superficie?: string | null
          id_buzo?: string
          id_cliente?: string | null
          id_inmersion?: string
          id_supervisor?: string | null
          numero_serie_ordenador?: string | null
          temperatura_agua?: number | null
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_inmersion_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios_app"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_buzo_fkey"
            columns: ["id_buzo"]
            isOneToOne: false
            referencedRelation: "buzo"
            referencedColumns: ["id_buzo"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_supervisor_fkey"
            columns: ["id_supervisor"]
            isOneToOne: false
            referencedRelation: "supervisor"
            referencedColumns: ["id_supervisor"]
          },
          {
            foreignKeyName: "perfil_inmersion_numero_serie_ordenador_fkey"
            columns: ["numero_serie_ordenador"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["numero_serie_ordenador"]
          },
        ]
      }
      supervisor: {
        Row: {
          created_at: string
          id_supervisor: string
          nombre_super: string
          rut_super: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id_supervisor?: string
          nombre_super: string
          rut_super: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id_supervisor?: string
          nombre_super?: string
          rut_super?: string
          updated_at?: string
        }
        Relationships: []
      }
      tiempos_totales: {
        Row: {
          created_at: string
          id_buzo: string
          id_inmersion: string
          profundidad_maxima: number | null
          tabulacion: string | null
          tiempo_total_buceo: number | null
          tiempo_total_descompresion: number | null
          tiempo_total_fondo: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id_buzo: string
          id_inmersion: string
          profundidad_maxima?: number | null
          tabulacion?: string | null
          tiempo_total_buceo?: number | null
          tiempo_total_descompresion?: number | null
          tiempo_total_fondo?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id_buzo?: string
          id_inmersion?: string
          profundidad_maxima?: number | null
          tabulacion?: string | null
          tiempo_total_buceo?: number | null
          tiempo_total_descompresion?: number | null
          tiempo_total_fondo?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiempos_totales_id_buzo_fkey"
            columns: ["id_buzo"]
            isOneToOne: false
            referencedRelation: "buzo"
            referencedColumns: ["id_buzo"]
          },
          {
            foreignKeyName: "tiempos_totales_id_inmersion_fkey"
            columns: ["id_inmersion"]
            isOneToOne: true
            referencedRelation: "perfil_inmersion"
            referencedColumns: ["id_inmersion"]
          },
        ]
      }
      usuarios_app: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
    }
    Enums: {
      user_role: "admin" | "supervisor" | "lectura"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type UserRole = Database["public"]["Enums"]["user_role"]
