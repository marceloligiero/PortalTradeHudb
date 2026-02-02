import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Textarea from './Textarea';
import StarRating from './StarRating';
import api from '../lib/axios';
import { useTranslation } from 'react-i18next';

type RatingType = 'COURSE' | 'LESSON' | 'CHALLENGE' | 'TRAINER' | 'TRAINING_PLAN';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  ratingType: RatingType;
  itemId: number;
  itemTitle: string;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ratingType,
  itemId,
  itemTitle
}) => {
  const { t } = useTranslation();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const ratingTypeLabels: Record<RatingType, string> = {
    COURSE: t('ratingModal.theCourse'),
    LESSON: t('ratingModal.theLesson'),
    CHALLENGE: t('ratingModal.theChallenge'),
    TRAINER: t('ratingModal.theTrainer'),
    TRAINING_PLAN: t('ratingModal.theTrainingPlan')
  };

  const starLabels: Record<number, string> = {
    1: t('ratingModal.veryWeak'),
    2: t('ratingModal.weak'),
    3: t('ratingModal.fair'),
    4: t('ratingModal.good'),
    5: t('ratingModal.excellent')
  };

  const handleSubmit = async () => {
    if (stars === 0) {
      setError(t('ratingModal.selectRating'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        rating_type: ratingType,
        stars,
        comment: comment || null
      };

      // Add the appropriate ID field based on rating type
      if (ratingType === 'COURSE') payload.course_id = itemId;
      else if (ratingType === 'LESSON') payload.lesson_id = itemId;
      else if (ratingType === 'CHALLENGE') payload.challenge_id = itemId;
      else if (ratingType === 'TRAINER') payload.trainer_id = itemId;
      else if (ratingType === 'TRAINING_PLAN') payload.training_plan_id = itemId;

      console.log('Rating payload:', JSON.stringify(payload));
      await api.post('/api/ratings/submit', payload);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
        // Reset state
        setStars(0);
        setComment('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || t('ratingModal.submitError');
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setStars(0);
      setComment('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('ratingModal.title')}>
      <div className="space-y-6">
        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
              {t('ratingModal.thankYou')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('ratingModal.yourOpinionMatters')}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300">
                {t('ratingModal.howDoYouRate')} {ratingTypeLabels[ratingType]}:
              </p>
              <p className="font-semibold text-lg mt-1 text-blue-600 dark:text-blue-400">
                {itemTitle}
              </p>
            </div>

            <div className="flex justify-center py-4">
              <StarRating
                value={stars}
                onChange={setStars}
                size="lg"
                showValue={false}
              />
            </div>

            <div className="text-center">
              {stars > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {starLabels[stars]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('ratingModal.commentOptional')}
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('ratingModal.shareOpinion')}
                rows={4}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={stars === 0 || isSubmitting}
              >
                {isSubmitting ? t('ratingModal.submitting') : t('ratingModal.submitRating')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default RatingModal;
