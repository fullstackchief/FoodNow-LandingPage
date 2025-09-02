'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { 
  GiftIcon, 
  TrophyIcon,
  FireIcon,
  SparklesIcon,
  AcademicCapIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import DashboardCard from '@/components/ui/DashboardCard'

interface Tier {
  name: string
  minPoints: number
  maxPoints: number
  color: string
  icon: React.ReactNode
  benefits: string[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

const RewardsWidget = () => {
  const { user } = useAuth()
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [progressAnimation, setProgressAnimation] = useState(0)

  const tiers: Tier[] = [
    {
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 1000,
      color: 'from-amber-400 to-amber-600',
      icon: <StarIcon className="w-4 h-4" />,
      benefits: ['5% Cashback', 'Free Delivery on ₦5000+']
    },
    {
      name: 'Silver',
      minPoints: 1000,
      maxPoints: 5000,
      color: 'from-gray-400 to-gray-600',
      icon: <TrophyIcon className="w-4 h-4" />,
      benefits: ['10% Cashback', 'Free Delivery on ₦3000+', 'Priority Support']
    },
    {
      name: 'Gold',
      minPoints: 5000,
      maxPoints: 15000,
      color: 'from-yellow-400 to-yellow-600',
      icon: <AcademicCapIcon className="w-4 h-4" />,
      benefits: ['15% Cashback', 'Free Delivery Always', 'Premium Support', 'Birthday Treats']
    },
    {
      name: 'Platinum',
      minPoints: 15000,
      maxPoints: Infinity,
      color: 'from-indigo-400 to-indigo-600',
      icon: <SparklesIcon className="w-4 h-4" />,
      benefits: ['20% Cashback', 'VIP Access', 'Personal Concierge', 'Exclusive Events']
    }
  ]

  const achievements: Achievement[] = [
    {
      id: 'first_order',
      title: 'First Order',
      description: 'Placed your first order',
      icon: <GiftIcon className="w-4 h-4" />,
      unlocked: (user?.total_orders || 0) > 0
    },
    {
      id: 'frequent_orderer',
      title: 'Frequent Orderer',
      description: 'Order 10 times',
      icon: <FireIcon className="w-4 h-4" />,
      unlocked: (user?.total_orders || 0) >= 10,
      progress: user?.total_orders || 0,
      maxProgress: 10
    },
    {
      id: 'loyalty_member',
      title: 'Loyalty Member',
      description: 'Reach 1000 points',
      icon: <StarIcon className="w-4 h-4" />,
      unlocked: (user?.loyalty_points || 0) >= 1000,
      progress: Math.min(user?.loyalty_points || 0, 1000),
      maxProgress: 1000
    },
    {
      id: 'gold_status',
      title: 'Gold Status',
      description: 'Reach Gold tier',
      icon: <AcademicCapIcon className="w-4 h-4" />,
      unlocked: user?.tier === 'gold' || user?.tier === 'platinum'
    }
  ]

  const currentTier = tiers.find(tier => 
    (user?.loyalty_points || 0) >= tier.minPoints && 
    (user?.loyalty_points || 0) < tier.maxPoints
  ) || tiers[0]

  const nextTier = tiers.find(tier => tier.minPoints > (user?.loyalty_points || 0))
  const progressToNext = nextTier 
    ? ((user?.loyalty_points || 0) - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints) * 100
    : 100

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
      setProgressAnimation(progressToNext)
    }
  }, [isInView, controls, progressToNext])

  return (
    <div ref={ref} className="space-y-6">
      {/* Tier Progress Card */}
      <DashboardCard
        title="Loyalty Status"
        subtitle={`${user?.loyalty_points || 0} points earned`}
        icon={<TrophyIcon className="w-6 h-6 text-orange-600" />}
        variant="premium"
        className="relative overflow-hidden"
      >
        {/* Current Tier Display */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`
              w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTier.color}
              flex items-center justify-center shadow-lg
            `}>
              <div className="text-white">
                {currentTier.icon}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{currentTier.name}</h3>
              <p className="text-sm text-gray-600">Current Tier</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold gradient-text">
              {user?.loyalty_points?.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-gray-500">Points</p>
          </div>
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress to {nextTier.name}
              </span>
              <span className="text-sm text-gray-500">
                {nextTier.minPoints - (user?.loyalty_points || 0)} points to go
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressAnimation}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Current Benefits */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 mb-3">Your Benefits</h4>
          {currentTier.benefits.map((benefit, index) => (
            <motion.div
              key={benefit}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </DashboardCard>

      {/* Achievements */}
      <DashboardCard
        title="Achievements"
        subtitle="Your progress milestones"
        icon={<StarIcon className="w-6 h-6 text-orange-600" />}
        variant="glass"
      >
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300
                ${achievement.unlocked 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm' 
                  : 'bg-gray-50 border-gray-200 opacity-60'}
              `}
            >
              {/* Achievement Icon */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center mb-3
                ${achievement.unlocked 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-500'}
              `}>
                {achievement.icon}
              </div>

              {/* Achievement Info */}
              <h5 className={`
                font-semibold text-sm mb-1
                ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {achievement.title}
              </h5>
              <p className={`
                text-xs
                ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}
              `}>
                {achievement.description}
              </p>

              {/* Progress Bar for Incomplete Achievements */}
              {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.progress}/{achievement.maxProgress}
                  </p>
                </div>
              )}

              {/* Unlock Animation */}
              {achievement.unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <SparklesIcon className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </DashboardCard>
    </div>
  )
}

export default RewardsWidget