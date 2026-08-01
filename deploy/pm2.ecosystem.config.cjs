module.exports = {
  apps: [
    {
      name: 'starsync-backend',
      cwd: '../Starsync_backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
