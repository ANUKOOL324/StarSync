import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthFormField } from '../components/AuthFormField'
import { useAuth } from '../hooks/useAuth'

type FormErrors = {
  username?: string
  email?: string
  password?: string
  root?: string
}

export function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, signup } = useAuth()
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const nextErrors: FormErrors = {}

    if (username.length < 3) nextErrors.username = 'Use at least 3 characters.'
    if (!email.includes('@')) nextErrors.email = 'Enter a valid email.'
    if (password.length < 8) nextErrors.password = 'Use at least 8 characters.'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await signup({ username, email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Signup failed.'
          : 'Signup failed.'
      setErrors({ root: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-md rounded-xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-2xl shadow-black/45"
    >
      <div className="rounded-[10px] bg-black/58 p-6 backdrop-blur-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#7FFFE0]">Create profile</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign up</h1>
        <p className="mt-2 text-sm text-zinc-400">Create an account for the chat dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <AuthFormField
            id="username"
            name="username"
            label="Username"
            placeholder="anukool"
            error={errors.username}
          />
          <AuthFormField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email}
          />
          <AuthFormField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            error={errors.password}
          />
          {errors.root ? <p className="text-sm text-red-300">{errors.root}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#18D6A3] px-4 py-3 text-sm font-semibold text-[#03110E] shadow-lg shadow-[#18D6A3]/15 transition duration-150 hover:bg-[#35E0B4] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UserPlus size={17} aria-hidden="true" />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-zinc-400">
          Already have an account?{' '}
          <Link className="font-medium text-[#7FFFE0] hover:text-white" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </motion.section>
  )
}

