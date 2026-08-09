import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthFormField } from '../components/AuthFormField'
import { Button } from '../components/ui/Button'
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
        <p className="auth-kicker">Create profile</p>
        <h1 className="auth-title mt-3">Sign up</h1>
        <p className="auth-copy mt-2">Create an account for the chat dashboard.</p>

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
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="ghost"
            className="landing-nav-button h-11 w-full rounded-full border-2 border-white/10 bg-transparent px-7 text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed"
          >
            <UserPlus size={17} aria-hidden="true" />
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="auth-copy mt-5">
          Already have an account?{' '}
          <Link className="auth-link hover:text-white" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </motion.section>
  )
}

