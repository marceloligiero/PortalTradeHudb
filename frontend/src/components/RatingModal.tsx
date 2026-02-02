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

const ratingTypeLabels: Record<RatingType, string> = {
  COURSE: 'o curso',
  LESSON: 'a aula',
  CHALLENGE: 'o desafio',
  TRAINER: 'o formador',
  TRAINING_PLAN: 'o plano de formação'
};

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

  const handleSubmit = async () => {
    if (stars === 0) {
      setError('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao submeter avaliação. Tente novamente.';
      setError(errorMessage);
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Avaliar">
      <div className="space-y-6">
        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
              Obrigado pela sua avaliação!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              A sua opinião é importante para nós.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-gray-700 dark:text-gray-300">
                Como avalia {ratingTypeLabels[ratingType]}:
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
                  {stars === 1 && 'Muito Fraco'}
                  {stars === 2 && 'Fraco'}
                  {stars === 3 && 'Razoável'}
                  {stars === 4 && 'Bom'}
                  {stars === 5 && 'Excelente'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comentário (opcional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partilhe a sua opinião..."
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
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={stars === 0 || isSubmitting}
              >
                {isSubmitting ? 'A enviar...' : 'Submeter Avaliação'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default RatingModal;
