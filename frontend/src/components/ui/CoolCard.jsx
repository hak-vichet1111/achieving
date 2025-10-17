import React from 'react'

const CoolCard = () => {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-2xl rounded-xl text-center">
      <h1 className="text-4xl font-bold text-blue-600 mb-4"> Setup Complete!</h1>
      <p className="text-gray-700">
        You now have a professional React + Tailwind CSS setup.
      </p>
      <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Get Started
      </button>
    </div>
  )
}

export default CoolCard
