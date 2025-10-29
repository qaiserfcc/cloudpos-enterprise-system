import Joi from 'joi';
import { CustomerStatus, CustomerType, CustomerSegment, LoyaltyTier } from '../models/types';

export const createCustomerSchema = Joi.object({
  type: Joi.string().valid(...Object.values(CustomerType)).default(CustomerType.INDIVIDUAL),
  firstName: Joi.string().required().min(1).max(50).trim(),
  lastName: Joi.string().required().min(1).max(50).trim(),
  email: Joi.string().email().optional().trim().lowercase(),
  phone: Joi.string().optional().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20),
  dateOfBirth: Joi.date().optional().less('now'),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  companyName: Joi.string().optional().max(100).trim(),
  taxId: Joi.string().optional().max(50).trim(),
  address: Joi.object({
    type: Joi.string().valid('home', 'work', 'billing', 'shipping', 'other').default('home'),
    street1: Joi.string().required().max(255).trim(),
    street2: Joi.string().optional().max(255).trim(),
    city: Joi.string().required().max(100).trim(),
    state: Joi.string().required().max(100).trim(),
    postalCode: Joi.string().required().max(20).trim(),
    country: Joi.string().default('US').max(3).uppercase()
  }).optional(),
  preferences: Joi.object({
    contactMethod: Joi.string().valid('email', 'phone', 'sms', 'mail').default('email'),
    marketingOptIn: Joi.boolean().default(false),
    smsOptIn: Joi.boolean().default(false),
    emailOptIn: Joi.boolean().default(false),
    pushNotificationsOptIn: Joi.boolean().default(false),
    language: Joi.string().default('en').max(10),
    currency: Joi.string().default('USD').max(3).uppercase(),
    timezone: Joi.string().default('UTC').max(50)
  }).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  notes: Joi.string().max(1000).optional(),
  customFields: Joi.object().pattern(
    Joi.string().max(50),
    Joi.alternatives().try(
      Joi.string().max(500),
      Joi.number(),
      Joi.boolean(),
      Joi.date()
    )
  ).optional()
});

export const updateCustomerSchema = Joi.object({
  firstName: Joi.string().optional().min(1).max(50).trim(),
  lastName: Joi.string().optional().min(1).max(50).trim(),
  email: Joi.string().email().optional().allow(null).trim().lowercase(),
  phone: Joi.string().optional().allow(null).pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20),
  dateOfBirth: Joi.date().optional().allow(null).less('now'),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  companyName: Joi.string().optional().allow(null).max(100).trim(),
  taxId: Joi.string().optional().allow(null).max(50).trim(),
  status: Joi.string().valid(...Object.values(CustomerStatus)).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(20).optional(),
  notes: Joi.string().max(1000).optional(),
  customFields: Joi.object().pattern(
    Joi.string().max(50),
    Joi.alternatives().try(
      Joi.string().max(500),
      Joi.number(),
      Joi.boolean(),
      Joi.date()
    )
  ).optional()
});

export const customerSearchSchema = Joi.object({
  query: Joi.string().optional().max(100).trim(),
  status: Joi.string().valid(...Object.values(CustomerStatus)).optional(),
  type: Joi.string().valid(...Object.values(CustomerType)).optional(),
  segment: Joi.string().valid(...Object.values(CustomerSegment)).optional(),
  tier: Joi.string().valid(...Object.values(LoyaltyTier)).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  createdFrom: Joi.date().optional(),
  createdTo: Joi.date().optional().min(Joi.ref('createdFrom')),
  lastVisitFrom: Joi.date().optional(),
  lastVisitTo: Joi.date().optional().min(Joi.ref('lastVisitFrom')),
  totalSpentMin: Joi.number().min(0).optional(),
  totalSpentMax: Joi.number().min(Joi.ref('totalSpentMin')).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('createdAt', 'name', 'email', 'lastVisitAt', 'totalSpent').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const loyaltyPointsSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  type: Joi.string().valid('earned', 'redeemed', 'expired', 'adjusted').required(),
  points: Joi.number().positive().precision(2).required(),
  description: Joi.string().required().max(255),
  transactionId: Joi.string().optional().max(100),
  reference: Joi.string().optional().max(100)
});

export const customerIdSchema = Joi.object({
  customerId: Joi.string().uuid().required()
});

export const storeIdSchema = Joi.object({
  storeId: Joi.string().uuid().required()
});

export const addAddressSchema = Joi.object({
  type: Joi.string().valid('home', 'work', 'billing', 'shipping', 'other').required(),
  street1: Joi.string().required().max(255).trim(),
  street2: Joi.string().optional().max(255).trim(),
  city: Joi.string().required().max(100).trim(),
  state: Joi.string().required().max(100).trim(),
  postalCode: Joi.string().required().max(20).trim(),
  country: Joi.string().default('US').max(3).uppercase(),
  isDefault: Joi.boolean().default(false)
});

export const updateAddressSchema = Joi.object({
  type: Joi.string().valid('home', 'work', 'billing', 'shipping', 'other').optional(),
  street1: Joi.string().optional().max(255).trim(),
  street2: Joi.string().optional().allow(null).max(255).trim(),
  city: Joi.string().optional().max(100).trim(),
  state: Joi.string().optional().max(100).trim(),
  postalCode: Joi.string().optional().max(20).trim(),
  country: Joi.string().optional().max(3).uppercase(),
  isDefault: Joi.boolean().optional()
});

export const updatePreferencesSchema = Joi.object({
  contactMethod: Joi.string().valid('email', 'phone', 'sms', 'mail').optional(),
  marketingOptIn: Joi.boolean().optional(),
  smsOptIn: Joi.boolean().optional(),
  emailOptIn: Joi.boolean().optional(),
  pushNotificationsOptIn: Joi.boolean().optional(),
  language: Joi.string().optional().max(10),
  currency: Joi.string().optional().max(3).uppercase(),
  timezone: Joi.string().optional().max(50),
  communicationFrequency: Joi.string().valid('daily', 'weekly', 'monthly', 'never').optional()
});

export const bulkOperationSchema = Joi.object({
  customerIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
  operation: Joi.string().valid('updateStatus', 'addTags', 'removeTags', 'updateSegment', 'delete').required(),
  data: Joi.object().when('operation', {
    is: 'updateStatus',
    then: Joi.object({
      status: Joi.string().valid(...Object.values(CustomerStatus)).required()
    }),
    otherwise: Joi.when('operation', {
      is: Joi.alternatives().try('addTags', 'removeTags'),
      then: Joi.object({
        tags: Joi.array().items(Joi.string().max(50)).min(1).max(10).required()
      }),
      otherwise: Joi.when('operation', {
        is: 'updateSegment',
        then: Joi.object({
          segment: Joi.string().valid(...Object.values(CustomerSegment)).required()
        }),
        otherwise: Joi.object()
      })
    })
  })
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

export const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required().min(Joi.ref('startDate'))
});

// Custom validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateCustomerNumber = (customerNumber: string): boolean => {
  const customerNumberRegex = /^[A-Z0-9]{6,20}$/;
  return customerNumberRegex.test(customerNumber);
};

export const validateTaxId = (taxId: string, country: string = 'US'): boolean => {
  switch (country.toUpperCase()) {
    case 'US':
      // US SSN or EIN format
      return /^\d{3}-\d{2}-\d{4}$/.test(taxId) || /^\d{2}-\d{7}$/.test(taxId);
    case 'CA':
      // Canadian SIN format
      return /^\d{3}-\d{3}-\d{3}$/.test(taxId);
    case 'GB':
      // UK National Insurance Number
      return /^[A-Z]{2}\d{6}[A-Z]$/.test(taxId);
    default:
      // Generic validation - just check it's alphanumeric
      return /^[A-Z0-9\-]{5,20}$/i.test(taxId);
  }
};

export const validatePostalCode = (postalCode: string, country: string = 'US'): boolean => {
  switch (country.toUpperCase()) {
    case 'US':
      return /^\d{5}(-\d{4})?$/.test(postalCode);
    case 'CA':
      return /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(postalCode);
    case 'GB':
      return /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i.test(postalCode);
    case 'DE':
      return /^\d{5}$/.test(postalCode);
    case 'FR':
      return /^\d{5}$/.test(postalCode);
    default:
      return /^[A-Z0-9\s\-]{3,10}$/i.test(postalCode);
  }
};