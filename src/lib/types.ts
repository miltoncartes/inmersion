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
      botellas_aux: {
        Row: {
          created_at: string
          fecha_venc_aux: string | null
          id_botella_aux: string
          nombre_botella_aux: string
          observacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha_venc_aux?: string | null
          id_botella_aux?: string
          nombre_botella_aux: string
          observacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha_venc_aux?: string | null
          id_botella_aux?: string
          nombre_botella_aux?: string
          observacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      botellas_emer: {
        Row: {
          created_at: string
          fecha_venc_emer: string | null
          id_botella_emer: string
          nombre_botella_emer: string
          observacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha_venc_emer?: string | null
          id_botella_emer?: string
          nombre_botella_emer: string
          observacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha_venc_emer?: string | null
          id_botella_emer?: string
          nombre_botella_emer?: string
          observacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      buzo: {
        Row: {
          clase_matricula: string | null
          created_at: string
          email: string | null
          estado: string
          habilitado: boolean
          id_buzo: string
          id_equipo_asignado: string | null
          nombre_buzo: string
          rut_buzo: string
          updated_at: string
          vencimiento_hipervarico: string | null
        }
        Insert: {
          clase_matricula?: string | null
          created_at?: string
          email?: string | null
          estado?: string
          habilitado?: boolean
          id_buzo?: string
          id_equipo_asignado?: string | null
          nombre_buzo: string
          rut_buzo: string
          updated_at?: string
          vencimiento_hipervarico?: string | null
        }
        Update: {
          clase_matricula?: string | null
          created_at?: string
          email?: string | null
          estado?: string
          habilitado?: boolean
          id_buzo?: string
          id_equipo_asignado?: string | null
          nombre_buzo?: string
          rut_buzo?: string
          updated_at?: string
          vencimiento_hipervarico?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buzo_id_equipo_asignado_fkey"
            columns: ["id_equipo_asignado"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id_equipo"]
          },
        ]
      }
      centro_cultivo: {
        Row: {
          created_at: string
          id_centro_cultivo: string
          id_cliente: string
          nombre_centro: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id_centro_cultivo?: string
          id_cliente: string
          nombre_centro: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id_centro_cultivo?: string
          id_cliente?: string
          nombre_centro?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "centro_cultivo_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
        ]
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
          fecha_calibracion_consola_aire: string | null
          fecha_mantencion_cargador_alta_presion: string | null
          fecha_mantencion_consola_comunicaciones: string | null
          id_botella_aux: string | null
          id_botella_emer: string | null
          id_equipo: string
          id_masc: string | null
          matricula_equipo: string | null
          nombre_ordenador: string
          numero_serie_cargador_alta_presion: string | null
          numero_serie_consola_aire: string | null
          numero_serie_consola_comunicaciones: string | null
          updated_at: string
          vencimiento_equipo: string | null
        }
        Insert: {
          created_at?: string
          fecha_calibracion_consola_aire?: string | null
          fecha_mantencion_cargador_alta_presion?: string | null
          fecha_mantencion_consola_comunicaciones?: string | null
          id_botella_aux?: string | null
          id_botella_emer?: string | null
          id_equipo?: string
          id_masc?: string | null
          matricula_equipo?: string | null
          nombre_ordenador: string
          numero_serie_cargador_alta_presion?: string | null
          numero_serie_consola_aire?: string | null
          numero_serie_consola_comunicaciones?: string | null
          updated_at?: string
          vencimiento_equipo?: string | null
        }
        Update: {
          created_at?: string
          fecha_calibracion_consola_aire?: string | null
          fecha_mantencion_cargador_alta_presion?: string | null
          fecha_mantencion_consola_comunicaciones?: string | null
          id_botella_aux?: string | null
          id_botella_emer?: string | null
          id_equipo?: string
          id_masc?: string | null
          matricula_equipo?: string | null
          nombre_ordenador?: string
          numero_serie_cargador_alta_presion?: string | null
          numero_serie_consola_aire?: string | null
          numero_serie_consola_comunicaciones?: string | null
          updated_at?: string
          vencimiento_equipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_id_botella_aux_fkey"
            columns: ["id_botella_aux"]
            isOneToOne: false
            referencedRelation: "botellas_aux"
            referencedColumns: ["id_botella_aux"]
          },
          {
            foreignKeyName: "equipos_id_botella_emer_fkey"
            columns: ["id_botella_emer"]
            isOneToOne: false
            referencedRelation: "botellas_emer"
            referencedColumns: ["id_botella_emer"]
          },
          {
            foreignKeyName: "equipos_id_masc_fkey"
            columns: ["id_masc"]
            isOneToOne: false
            referencedRelation: "mascaras"
            referencedColumns: ["id_masc"]
          },
        ]
      }
      mascaras: {
        Row: {
          created_at: string
          fecha_mant_masc: string | null
          id_masc: string
          nombre_masc: string
          observacion: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fecha_mant_masc?: string | null
          id_masc?: string
          nombre_masc: string
          observacion?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fecha_mant_masc?: string | null
          id_masc?: string
          nombre_masc?: string
          observacion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      perfil_inmersion: {
        Row: {
          created_at: string
          created_by: string | null
          embarcacion: string | null
          estado_mar: string | null
          estado_validacion: Database["public"]["Enums"]["estado_validacion_inmersion"]
          faena_realizada: string | null
          fecha_inmersion: string
          hora_dejo_fondo: string | null
          hora_dejo_superficie: string | null
          hora_llego_fondo: string | null
          hora_llego_superficie: string | null
          id_buzo: string
          id_buzo_emergencia: string | null
          id_centro_cultivo: string | null
          id_cliente: string | null
          id_equipo: string | null
          id_inmersion: string
          id_navy: string | null
          id_supervisor: string | null
          observacion_admin: string | null
          temperatura_agua: number | null
          ubicacion: string | null
          updated_at: string
          validado_at: string | null
          validado_por: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          embarcacion?: string | null
          estado_mar?: string | null
          estado_validacion?: Database["public"]["Enums"]["estado_validacion_inmersion"]
          faena_realizada?: string | null
          fecha_inmersion: string
          hora_dejo_fondo?: string | null
          hora_dejo_superficie?: string | null
          hora_llego_fondo?: string | null
          hora_llego_superficie?: string | null
          id_buzo: string
          id_buzo_emergencia?: string | null
          id_centro_cultivo?: string | null
          id_cliente?: string | null
          id_equipo?: string | null
          id_inmersion?: string
          id_navy?: string | null
          id_supervisor?: string | null
          observacion_admin?: string | null
          temperatura_agua?: number | null
          ubicacion?: string | null
          updated_at?: string
          validado_at?: string | null
          validado_por?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          embarcacion?: string | null
          estado_mar?: string | null
          estado_validacion?: Database["public"]["Enums"]["estado_validacion_inmersion"]
          faena_realizada?: string | null
          fecha_inmersion?: string
          hora_dejo_fondo?: string | null
          hora_dejo_superficie?: string | null
          hora_llego_fondo?: string | null
          hora_llego_superficie?: string | null
          id_buzo?: string
          id_buzo_emergencia?: string | null
          id_centro_cultivo?: string | null
          id_cliente?: string | null
          id_equipo?: string | null
          id_inmersion?: string
          id_navy?: string | null
          id_supervisor?: string | null
          observacion_admin?: string | null
          temperatura_agua?: number | null
          ubicacion?: string | null
          updated_at?: string
          validado_at?: string | null
          validado_por?: string | null
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
            foreignKeyName: "perfil_inmersion_id_buzo_emergencia_fkey"
            columns: ["id_buzo_emergencia"]
            isOneToOne: false
            referencedRelation: "buzo"
            referencedColumns: ["id_buzo"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_buzo_fkey"
            columns: ["id_buzo"]
            isOneToOne: false
            referencedRelation: "buzo"
            referencedColumns: ["id_buzo"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_centro_cultivo_fkey"
            columns: ["id_centro_cultivo"]
            isOneToOne: false
            referencedRelation: "centro_cultivo"
            referencedColumns: ["id_centro_cultivo"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_equipo_fkey"
            columns: ["id_equipo"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id_equipo"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_navy_fkey"
            columns: ["id_navy"]
            isOneToOne: false
            referencedRelation: "tabla_us_navy"
            referencedColumns: ["id_navy"]
          },
          {
            foreignKeyName: "perfil_inmersion_id_supervisor_fkey"
            columns: ["id_supervisor"]
            isOneToOne: false
            referencedRelation: "supervisor"
            referencedColumns: ["id_supervisor"]
          },
          {
            foreignKeyName: "perfil_inmersion_validado_por_fkey"
            columns: ["validado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_app"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor: {
        Row: {
          created_at: string
          email: string | null
          fecha_vencimiento_matricula: string | null
          habilitado: boolean
          id_supervisor: string
          nombre_super: string
          rut_super: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          fecha_vencimiento_matricula?: string | null
          habilitado?: boolean
          id_supervisor?: string
          nombre_super: string
          rut_super: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          fecha_vencimiento_matricula?: string | null
          habilitado?: boolean
          id_supervisor?: string
          nombre_super?: string
          rut_super?: string
          updated_at?: string
        }
        Relationships: []
      }
      tabla_us_navy: {
        Row: {
          composicion: string
          created_at: string
          id_navy: string
          observacion: string | null
          updated_at: string
        }
        Insert: {
          composicion: string
          created_at?: string
          id_navy?: string
          observacion?: string | null
          updated_at?: string
        }
        Update: {
          composicion?: string
          created_at?: string
          id_navy?: string
          observacion?: string | null
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
          id_buzo: string | null
          id_supervisor: string | null
          nombre: string
          rol: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          id_buzo?: string | null
          id_supervisor?: string | null
          nombre: string
          rol?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          id_buzo?: string | null
          id_supervisor?: string | null
          nombre?: string
          rol?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_app_id_buzo_fkey"
            columns: ["id_buzo"]
            isOneToOne: false
            referencedRelation: "buzo"
            referencedColumns: ["id_buzo"]
          },
          {
            foreignKeyName: "usuarios_app_id_supervisor_fkey"
            columns: ["id_supervisor"]
            isOneToOne: false
            referencedRelation: "supervisor"
            referencedColumns: ["id_supervisor"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_editor: { Args: never; Returns: boolean }
      mi_id_buzo: { Args: never; Returns: string }
      puede_recuperar_password: { Args: { p_email: string }; Returns: boolean }
      estado_registro_email: { Args: { p_email: string }; Returns: string }
      eliminar_usuario: { Args: { p_id: string }; Returns: undefined }
    }
    Enums: {
      estado_validacion_inmersion: "pendiente" | "validada"
      user_role: "admin" | "supervisor" | "buzo"
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
export type EstadoValidacion = Database["public"]["Enums"]["estado_validacion_inmersion"]
