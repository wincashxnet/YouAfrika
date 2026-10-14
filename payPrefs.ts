import { remember } from './visitor'

/**
 * Mémoire locale du paiement Mobile Money (sur cet appareil) : pays, numéro et opérateur préféré.
 * Remplie à l'inscription (opérateur) puis à chaque achat ; relue par la page d'achat pour proposer le même choix d'avance.
 * Aucune information sensible : jamais de montant, de code OTP ni de mot de passe.
 */
export const PAY_PHONE_KEY = 'youafrika-pay-phone'
export const PAY_IK_PHONE_KEY = 'youafrika-pay-phone-ik'
export const PAY_COUNTRY_KEY = 'youafrika-pay-country'
export const PAY_OPERATOR_KEY = 'youafrika-pay-operator'
/** Le Gabon se paie par PVit ; les autres pays (Mobile Money) par iKeePay. */
export const GABON_CODE = 'GA'

/** Gabon : « airtel_money » ou « moov_money ». Ailleurs : code opérateur iKeePay (WAVE, ORANGE, MTN…). */
const GABON_OPERATORS = ['airtel_money', 'moov_money']
export const isGabonOperator = (v: string) => GABON_OPERATORS.includes(v)

/** Retient le pays et l'opérateur choisis pour les prochains achats. */
export function savePreferredOperator(countryCode: string, operator: string) {
  if (!operator) return
  remember.set(PAY_COUNTRY_KEY, countryCode || GABON_CODE)
  remember.set(PAY_OPERATOR_KEY, operator)
}
/** Opérateur retenu (chaîne vide s'il n'y en a pas). */
export const preferredOperator = () => remember.get(PAY_OPERATOR_KEY)
