import { apiClient } from './apiClient'
import type { CodeDocument, CodeRunResult, EditorLanguage, RoomProblemRunResult, RoomProblemSubmitResult, SubmissionHistoryItem } from '../types/editor'

type DocumentResponse = {
  document: CodeDocument
}

type RunCodeResponse = {
  result: CodeRunResult
}

type RoomProblemRunResponse = RoomProblemRunResult

const getSafeEditorErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return 'Could not run code'
  }

  const maybeAxiosError = error as {
    response?: {
      status?: number
      data?: {
        message?: string
      }
    }
  }

  const statusCode = maybeAxiosError.response?.status
  const serverMessage = maybeAxiosError.response?.data?.message

  if (serverMessage === 'Unsupported language.') {
    return 'Unsupported language.'
  }

  if (statusCode === 502 || statusCode === 504) {
    return 'Code runner is currently unavailable'
  }

  return 'Could not run code'
}

export const editorService = {
  async getDocument(roomId: string) {
    const response = await apiClient.get<DocumentResponse>(`/editor/${roomId}/document`)

    return response.data.document
  },

  async saveDocument(roomId: string, content: string, language: EditorLanguage) {
    const response = await apiClient.patch<DocumentResponse>(`/editor/${roomId}/document`, {
      content,
      language,
    })

    return response.data.document
  },

  async runProblemVisibleTestcases(roomId: string, problemId: string, language: EditorLanguage, code: string) {
    try {
      const response = await apiClient.post<RoomProblemRunResponse>(`/rooms/${roomId}/problems/run`, {
        roomId,
        problemId,
        language,
        code,
      })

      return response.data
    } catch (error) {
      throw new Error(getSafeEditorErrorMessage(error))
    }
  },
  async runCode(roomId: string, language: EditorLanguage, code: string, stdin: string) {
    try {
      const response = await apiClient.post<RunCodeResponse>('/editor/run', {
        roomId,
        language,
        code,
        stdin,
      })

      return response.data.result
    } catch (error) {
      throw new Error(getSafeEditorErrorMessage(error))
    }
  },

  async submitProblemCode(roomId: string, problemId: string, language: EditorLanguage, code: string) {
    try {
      const response = await apiClient.post<RoomProblemSubmitResult>(`/rooms/${roomId}/problems/submit`, {
        roomId,
        problemId,
        language,
        code,
      })

      return response.data
    } catch (error) {
      throw new Error(getSafeEditorErrorMessage(error))
    }
  },

  async getProblemSubmissions(roomId: string, problemId: string) {
    try {
      const response = await apiClient.get<{ submissions: SubmissionHistoryItem[] }>(
        `/rooms/${roomId}/problems/${problemId}/submissions`
      )

      return response.data.submissions
    } catch (error) {
      throw new Error(getSafeEditorErrorMessage(error))
    }
  },
}
