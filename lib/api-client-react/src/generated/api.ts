BroadcastMutationResult = NonNullable<Awaited<ReturnType<typeof createWhatsappBroadcast>>>
    export type CreateWhatsappBroadcastMutationBody = BodyType<BroadcastInput>
    export type CreateWhatsappBroadcastMutationError = ErrorType<unknown>

    /**
 * @summary Send a WhatsApp broadcast to all customers and retain fallback links
 */
export const useCreateWhatsappBroadcast = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createWhatsappBroadcast>>, TError,{data: BodyType<BroadcastInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createWhatsappBroadcast>>,
        TError,
        {data: BodyType<BroadcastInput>},
        TContext
      > => {
      return useMutation(getCreateWhatsappBroadcastMutationOptions(options));
    }

export const getBroadcastSmsUrl = () => {




  return `/api/admin/broadcast-sms`
}

/**
 * @summary Send a WhatsApp broadcast through the connected server session
 */
export const broadcastSms = async (smsBroadcastInput: SmsBroadcastInput, options?: Parameters<typeof customFetch>[1]): Promise<SmsBroadcastResult> => {

  return customFetch<SmsBroadcastResult>(getBroadcastSmsUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(smsBroadcastInput)
  }
);}





export const getBroadcastSmsMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof broadcastSms>>, TError,{data: BodyType<SmsBroadcastInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof broadcastSms>>, TError,{data: BodyType<SmsBroadcastInput>}, TContext> => {

const mutationKey = ['broadcastSms'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof broadcastSms>>, {data: BodyType<SmsBroadcastInput>}> = (props) => {
          const {data} = props ?? {};

          return  broadcastSms(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type BroadcastSmsMutationResult = NonNullable<Awaited<ReturnType<typeof broadcastSms>>>
    export type BroadcastSmsMutationBody = BodyType<SmsBroadcastInput>
    export type BroadcastSmsMutationError = ErrorType<unknown>

    /**
 * @summary Send a WhatsApp broadcast through the connected server session
 */
export const useBroadcastSms = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof broadcastSms>>, TError,{data: BodyType<SmsBroadcastInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof broadcastSms>>,
        TError,
        {data: BodyType<SmsBroadcastInput>},
        TContext
      > => {
      return useMutation(getBroadcastSmsMutationOptions(options));
    }

export const getListAdminCustomersUrl = () => {




  return `/api/admin/customers`
}

/**
 * @summary List customer accounts for the admin dashboard
 */
export const listAdminCustomers = async ( options?: Parameters<typeof customFetch>[1]): Promise<Customer[]> => {

  return customFetch<Customer[]>(getListAdminCustomersUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListAdminCustomersQueryKey = () => {
    return [
    `/api/admin/customers`
    ] as const;
    }


export const getListAdminCustomersQueryOptions = <TData = Awaited<ReturnType<typeof listAdminCustomers>>, TError = ErrorType<unknown>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAdminCustomers>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAdminCustomersQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAdminCustomers>>> = ({ signal }) => listAdminCustomers({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAdminCustomers>>, TError, TData> & { queryKey: QueryKey }
}

export type ListAdminCustomersQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminCustomers>>>
export type ListAdminCustomersQueryError = ErrorType<unknown>


/**
 * @summary List customer accounts for the admin dashboard
 */

export function useListAdminCustomers<TData = Awaited<ReturnType<typeof listAdminCustomers>>, TError = ErrorType<unknown>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAdminCustomers>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListAdminCustomersQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getSetCustomerBanUrl = (id: string,) => {




  return `/api/admin/customers/${id}/ban`
}

/**
 * @summary Ban or unban a customer account
 */
export const setCustomerBan = async (id: string,
    customerBanInput: CustomerBanInput, options?: Parameters<typeof customFetch>[1]): Promise<Customer> => {

  return customFetch<Customer>(getSetCustomerBanUrl(id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(customerBanInput)
  }
);}





export const getSetCustomerBanMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof setCustomerBan>>, TError,{id: string;data: BodyType<CustomerBanInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof setCustomerBan>>, TError,{id: string;data: BodyType<CustomerBanInput>}, TContext> => {

const mutationKey = ['setCustomerBan'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof setCustomerBan>>, {id: string;data: BodyType<CustomerBanInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  setCustomerBan(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type SetCustomerBanMutationResult = NonNullable<Awaited<ReturnType<typeof setCustomerBan>>>
    export type SetCustomerBanMutationBody = BodyType<CustomerBanInput>
    export type SetCustomerBanMutationError = ErrorType<unknown>

    /**
 * @summary Ban or unban a customer account
 */
export const useSetCustomerBan = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof setCustomerBan>>, TError,{id: string;data: BodyType<CustomerBanInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof setCustomerBan>>,
        TError,
        {id: string;data: BodyType<CustomerBanInput>},
        TContext
      > => {
      return useMutation(getSetCustomerBanMutationOptions(options));
    }

export const getUpdateCustomerRestrictionsUrl = (id: string,) => {




  return `/api/admin/customers/${id}/restrictions`
}

/**
 * @summary Restrict customer booking and update an account notice
 */
export const updateCustomerRestrictions = async (id: string,
    customerRestrictionsInput: CustomerRestrictionsInput, options?: Parameters<typeof customFetch>[1]): Promise<Customer> => {

  return customFetch<Customer>(getUpdateCustomerRestrictionsUrl(id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(customerRestrictionsInput)
  }
);}





export const getUpdateCustomerRestrictionsMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateCustomerRestrictions>>, TError,{id: string;data: BodyType<CustomerRestrictionsInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateCustomerRestrictions>>, TError,{id: string;data: BodyType<CustomerRestrictionsInput>}, TContext> => {

const mutationKey = ['updateCustomerRestrictions'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateCustomerRestrictions>>, {id: string;data: BodyType<CustomerRestrictionsInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  updateCustomerRestrictions(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateCustomerRestrictionsMutationResult = NonNullable<Awaited<ReturnType<typeof updateCustomerRestrictions>>>
    export type UpdateCustomerRestrictionsMutationBody = BodyType<CustomerRestrictionsInput>
    export type UpdateCustomerRestrictionsMutationError = ErrorType<unknown>

    /**
 * @summary Restrict customer booking and update an account notice
 */
export const useUpdateCustomerRestrictions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateCustomerRestrictions>>, TError,{id: string;data: BodyType<CustomerRestrictionsInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateCustomerRestrictions>>,
        TError,
        {id: string;data: BodyType<CustomerRestrictionsInput>},
        TContext
      > => {
      return useMutation(getUpdateCustomerRestrictionsMutationOptions(options));
    }

export const getResetCustomerPasswordUrl = (id: string,) => {




  return `/api/admin/customers/${id}/password`
}

/**
 * @summary Reset a customer password
 */
export const resetCustomerPassword = async (id: string,
    customerPasswordResetInput: CustomerPasswordResetInput, options?: Parameters<typeof customFetch>[1]): Promise<void> => {

  return customFetch<void>(getResetCustomerPasswordUrl(id),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(customerPasswordResetInput)
  }
);}





export const getResetCustomerPasswordMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof resetCustomerPassword>>, TError,{id: string;data: BodyType<CustomerPasswordResetInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof resetCustomerPassword>>, TError,{id: string;data: BodyType<CustomerPasswordResetInput>}, TContext> => {

const mutationKey = ['resetCustomerPassword'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof resetCustomerPassword>>, {id: string;data: BodyType<CustomerPasswordResetInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  resetCustomerPassword(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type ResetCustomerPasswordMutationResult = NonNullable<Awaited<ReturnType<typeof resetCustomerPassword>>>
    export type ResetCustomerPasswordMutationBody = BodyType<CustomerPasswordResetInput>
    export type ResetCustomerPasswordMutationError = ErrorType<unknown>

    /**
 * @summary Reset a customer password
 */
export const useResetCustomerPassword = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof resetCustomerPassword>>, TError,{id: string;data: BodyType<CustomerPasswordResetInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof resetCustomerPassword>>,
        TError,
        {id: string;data: BodyType<CustomerPasswordResetInput>},
        TContext
      > => {
      return useMutation(getResetCustomerPasswordMutationOptions(options));
    }

export const getDeleteCustomerUrl = (id: string,) => {




  return `/api/admin/customers/${id}`
}

/**
 * @summary Delete a customer account
 */
export const deleteCustomer = async (id: string, options?: Parameters<typeof customFetch>[1]): Promise<void> => {

  return customFetch<void>(getDeleteCustomerUrl(id),
  {
    ...options,
    method: 'DELETE'


  }
);}





export const getDeleteCustomerMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError,{id: string}, TContext> => {

const mutationKey = ['deleteCustomer'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteCustomer>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  deleteCustomer(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type DeleteCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCustomer>>>

    export type DeleteCustomerMutationError = ErrorType<unknown>

    /**
 * @summary Delete a customer account
 */
export const useDeleteCustomer = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof deleteCustomer>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getDeleteCustomerMutationOptions(options));
    }

export const getListMessageTemplatesUrl = () => {




  return `/api/admin/message-templates`
}

/**
 * @summary List editable automated WhatsApp message templates
 */
export const listMessageTemplates = async ( options?: Parameters<typeof customFetch>[1]): Promise<MessageTemplate[]> => {

  return customFetch<MessageTemplate[]>(getListMessageTemplatesUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListMessageTemplatesQueryKey = () => {
    return [
    `/api/admin/message-templates`
    ] as const;
    }


export const getListMessageTemplatesQueryOptions = <TData = Awaited<ReturnType<typeof listMessageTemplates>>, TError = ErrorType<unknown>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMessageTemplates>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListMessageTemplatesQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listMessageTemplates>>> = ({ signal }) => listMessageTemplates({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listMessageTemplates>>, TError, TData> & { queryKey: QueryKey }
}

export type ListMessageTemplatesQueryResult = NonNullable<Awaited<ReturnType<typeof listMessageTemplates>>>
export type ListMessageTemplatesQueryError = ErrorType<unknown>


/**
 * @summary List editable automated WhatsApp message templates
 */

export function useListMessageTemplates<TData = Awaited<ReturnType<typeof listMessageTemplates>>, TError = ErrorType<unknown>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listMessageTemplates>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListMessageTemplatesQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateMessageTemplateUrl = (key: string,) => {




  return `/api/admin/message-templates/${key}`
}

/**
 * @summary Update an automated WhatsApp message template
 */
export const updateMessageTemplate = async (key: string,
    messageTemplateInput: MessageTemplateInput, options?: Parameters<typeof customFetch>[1]): Promise<MessageTemplate> => {

  return customFetch<MessageTemplate>(getUpdateMessageTemplateUrl(key),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(messageTemplateInput)
  }
);}





export const getUpdateMessageTemplateMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMessageTemplate>>, TError,{key: string;data: BodyType<MessageTemplateInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateMessageTemplate>>, TError,{key: string;data: BodyType<MessageTemplateInput>}, TContext> => {

const mutationKey = ['updateMessageTemplate'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateMessageTemplate>>, {key: string;data: BodyType<MessageTemplateInput>}> = (props) => {
          const {key,data} = props ?? {};

          return  updateMessageTemplate(key,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateMessageTemplateMutationResult = NonNullable<Awaited<ReturnType<typeof updateMessageTemplate>>>
    export type UpdateMessageTemplateMutationBody = BodyType<MessageTemplateInput>
    export type UpdateMessageTemplateMutationError = ErrorType<unknown>

    /**
 * @summary Update an automated WhatsApp message template
 */
export const useUpdateMessageTemplate = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateMessageTemplate>>, TError,{key: string;data: BodyType<MessageTemplateInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateMessageTemplate>>,
        TError,
        {key: string;data: BodyType<MessageTemplateInput>},
        TContext
      > => {
      return useMutation(getUpdateMessageTemplateMutationOptions(options));
    }

export const getListAdminReviewsUrl = () => {




  return `/api/admin/reviews`
}

/**
 * @summary List customer reviews and suggestions
 */
export const listAdminReviews = async ( options?: Parameters<typeof customFetch>[1]): Promise<Review[]> => {

  return customFetch<Review[]>(getListAdminReviewsUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListAdminReviewsQueryKey = () => {
    return [
    `/api/admin/reviews`
    ] as const;
    }


export const getListAdminReviewsQueryOptions = <TData = Awaited<ReturnType<typeof listAdminReviews>>, TError = ErrorType<unknown>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAdminReviews>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAdminReviewsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAdminReviews>>> = ({ signal }) => listAdminReviews({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAdminReviews>>, TError, TData> & { queryKey: QueryKey }
}

export type ListAdminReviewsQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminReviews>>>
export type ListAdminReviewsQueryError = ErrorType<unknown>


/**
 * @summary List customer reviews and suggestions
 */

export function useListAdminReviews<TData = Awaited<ReturnType<typeof listAdminReviews>>, TError = ErrorType<unknown>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAdminReviews>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListAdminReviewsQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateReviewStatusUrl = (id: string,) => {




  return `/api/admin/reviews/${id}/status`
}

/**
 * @summary Update the review workflow status
 */
export const updateReviewStatus = async (id: string,
    reviewStatusInput: ReviewStatusInput, options?: Parameters<typeof customFetch>[1]): Promise<Review> => {

  return customFetch<Review>(getUpdateReviewStatusUrl(id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(reviewStatusInput)
  }
);}





export const getUpdateReviewStatusMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateReviewStatus>>, TError,{id: string;data: BodyType<ReviewStatusInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateReviewStatus>>, TError,{id: string;data: BodyType<ReviewStatusInput>}, TContext> => {

const mutationKey = ['updateReviewStatus'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateReviewStatus>>, {id: string;data: BodyType<ReviewStatusInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  updateReviewStatus(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateReviewStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateReviewStatus>>>
    export type UpdateReviewStatusMutationBody = BodyType<ReviewStatusInput>
    export type UpdateReviewStatusMutationError = ErrorType<unknown>

    /**
 * @summary Update the review workflow status
 */
export const useUpdateReviewStatus = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateReviewStatus>>, TError,{id: string;data: BodyType<ReviewStatusInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateReviewStatus>>,
        TError,
        {id: string;data: BodyType<ReviewStatusInput>},
        TContext
      > => {
      return useMutation(getUpdateReviewStatusMutationOptions(options));
    }

export const getCreateTicketUrl = () => {




  return `/api/tickets`
}

export const createTicket = async (ticketInput: TicketInput, options?: Parameters<typeof customFetch>[1]): Promise<Ticket> => {

  return customFetch<Ticket>(getCreateTicketUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(ticketInput)
  }
);}





export const getCreateTicketMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createTicket>>, TError,{data: BodyType<TicketInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createTicket>>, TError,{data: BodyType<TicketInput>}, TContext> => {

const mutationKey = ['createTicket'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createTicket>>, {data: BodyType<TicketInput>}> = (props) => {
          const {data} = props ?? {};

          return  createTicket(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateTicketMutationResult = NonNullable<Awaited<ReturnType<typeof createTicket>>>
    export type CreateTicketMutationBody = BodyType<TicketInput>
    export type CreateTicketMutationError = ErrorType<unknown>

    export const useCreateTicket = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createTicket>>, TError,{data: BodyType<TicketInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createTicket>>,
        TError,
        {data: BodyType<TicketInput>},
        TContext
      > => {
      return useMutation(getCreateTicketMutationOptions(options));
    }

export const getCancelTicketUrl = (id: string,) => {




  return `/api/tickets/${id}/cancel`
}

export const cancelTicket = async (id: string, options?: Parameters<typeof customFetch>[1]): Promise<Ticket> => {

  return customFetch<Ticket>(getCancelTicketUrl(id),
  {
    ...options,
    method: 'POST'


  }
);}





export const getCancelTicketMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelTicket>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof cancelTicket>>, TError,{id: string}, TContext> => {

const mutationKey = ['cancelTicket'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof cancelTicket>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  cancelTicket(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CancelTicketMutationResult = NonNullable<Awaited<ReturnType<typeof cancelTicket>>>

    export type CancelTicketMutationError = ErrorType<unknown>

    export const useCancelTicket = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelTicket>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof cancelTicket>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getCancelTicketMutationOptions(options));
    }

export const getAdvanceQueueUrl = () => {




  return `/api/queue/advance`
}

export const advanceQueue = async ( options?: Parameters<typeof customFetch>[1]): Promise<Ticket> => {

  return customFetch<Ticket>(getAdvanceQueueUrl(),
  {
    ...options,
    method: 'POST'


  }
);}





export const getAdvanceQueueMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof advanceQueue>>, TError,void, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof advanceQueue>>, TError,void, TContext> => {

const mutationKey = ['advanceQueue'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof advanceQueue>>, void> = () => {


          return  advanceQueue(requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type AdvanceQueueMutationResult = NonNullable<Awaited<ReturnType<typeof advanceQueue>>>

    export type AdvanceQueueMutationError = ErrorType<unknown>

    export const useAdvanceQueue = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof advanceQueue>>, TError,void, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof advanceQueue>>,
        TError,
        void,
        TContext
      > => {
      return useMutation(getAdvanceQueueMutationOptions(options));
    }

export const getAddWalkInUrl = () => {




  return `/api/walk-ins`
}

export const addWalkIn = async (walkInInput: WalkInInput, options?: Parameters<typeof customFetch>[1]): Promise<Ticket> => {

  return customFetch<Ticket>(getAddWalkInUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(walkInInput)
  }
);}





export const getAddWalkInMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof addWalkIn>>, TError,{data: BodyType<WalkInInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof addWalkIn>>, TError,{data: BodyType<WalkInInput>}, TContext> => {

const mutationKey = ['addWalkIn'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof addWalkIn>>, {data: BodyType<WalkInInput>}> = (props) => {
          const {data} = props ?? {};

          return  addWalkIn(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type AddWalkInMutationResult = NonNullable<Awaited<ReturnType<typeof addWalkIn>>>
    export type AddWalkInMutationBody = BodyType<WalkInInput>
    export type AddWalkInMutationError = ErrorType<unknown>

    export const useAddWalkIn = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof addWalkIn>>, TError,{data: BodyType<WalkInInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof addWalkIn>>,
        TError,
        {data: BodyType<WalkInInput>},
        TContext
      > => {
      return useMutation(getAddWalkInMutationOptions(options));
    }

export const getSummonTicketUrl = (id: string,) => {




  return `/api/tickets/${id}/summon`
}

export const summonTicket = async (id: string, options?: Parameters<typeof customFetch>[1]): Promise<SummonResult> => {

  return customFetch<SummonResult>(getSummonTicketUrl(id),
  {
    ...options,
    method: 'POST'


  }
);}





export const getSummonTicketMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof summonTicket>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof summonTicket>>, TError,{id: string}, TContext> => {

const mutationKey = ['summonTicket'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof summonTicket>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  summonTicket(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type SummonTicketMutationResult = NonNullable<Awaited<ReturnType<typeof summonTicket>>>

    export type SummonTicketMutationError = ErrorType<unknown>

    export const useSummonTicket = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof summonTicket>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof summonTicket>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getSummonTicketMutationOptions(options));
    }

export const getListAppointmentsUrl = (params?: ListAppointmentsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/appointments?${stringifiedParams}` : `/api/appointments`
}

export const listAppointments = async (params?: ListAppointmentsParams, options?: Parameters<typeof customFetch>[1]): Promise<Appointment[]> => {

  return customFetch<Appointment[]>(getListAppointmentsUrl(params),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListAppointmentsQueryKey = (params?: ListAppointmentsParams,) => {
    return [
    `/api/appointments`, ...(params ? [params] : [])
    ] as const;
    }


export const getListAppointmentsQueryOptions = <TData = Awaited<ReturnType<typeof listAppointments>>, TError = ErrorType<unknown>>(params?: ListAppointmentsParams, options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAppointments>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListAppointmentsQueryKey(params);



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listAppointments>>> = ({ signal }) => listAppointments(params, { signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listAppointments>>, TError, TData> & { queryKey: QueryKey }
}

export type ListAppointmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listAppointments>>>
export type ListAppointmentsQueryError = ErrorType<unknown>



export function useListAppointments<TData = Awaited<ReturnType<typeof listAppointments>>, TError = ErrorType<unknown>>(
 params?: ListAppointmentsParams, options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listAppointments>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListAppointmentsQueryOptions(params,options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getCreateAppointmentUrl = () => {




  return `/api/appointments`
}

export const createAppointment = async (appointmentInput: AppointmentInput, options?: Parameters<typeof customFetch>[1]): Promise<Appointment> => {

  return customFetch<Appointment>(getCreateAppointmentUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(appointmentInput)
  }
);}





export const getCreateAppointmentMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAppointment>>, TError,{data: BodyType<AppointmentInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createAppointment>>, TError,{data: BodyType<AppointmentInput>}, TContext> => {

const mutationKey = ['createAppointment'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createAppointment>>, {data: BodyType<AppointmentInput>}> = (props) => {
          const {data} = props ?? {};

          return  createAppointment(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateAppointmentMutationResult = NonNullable<Awaited<ReturnType<typeof createAppointment>>>
    export type CreateAppointmentMutationBody = BodyType<AppointmentInput>
    export type CreateAppointmentMutationError = ErrorType<unknown>

    export const useCreateAppointment = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createAppointment>>, TError,{data: BodyType<AppointmentInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createAppointment>>,
        TError,
        {data: BodyType<AppointmentInput>},
        TContext
      > => {
      return useMutation(getCreateAppointmentMutationOptions(options));
    }

export const getCreateReviewUrl = () => {




  return `/api/reviews`
}

/**
 * @summary Submit a customer rating and feedback
 */
export const createReview = async (reviewInput: ReviewInput, options?: Parameters<typeof customFetch>[1]): Promise<Review> => {

  return customFetch<Review>(getCreateReviewUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(reviewInput)
  }
);}





export const getCreateReviewMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError,{data: BodyType<ReviewInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError,{data: BodyType<ReviewInput>}, TContext> => {

const mutationKey = ['createReview'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createReview>>, {data: BodyType<ReviewInput>}> = (props) => {
          const {data} = props ?? {};

          return  createReview(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateReviewMutationResult = NonNullable<Awaited<ReturnType<typeof createReview>>>
    export type CreateReviewMutationBody = BodyType<ReviewInput>
    export type CreateReviewMutationError = ErrorType<unknown>

    /**
 * @summary Submit a customer rating and feedback
 */
export const useCreateReview = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createReview>>, TError,{data: BodyType<ReviewInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createReview>>,
        TError,
        {data: BodyType<ReviewInput>},
        TContext
      > => {
      return useMutation(getCreateReviewMutationOptions(options));
    }

export const getCancelAppointmentUrl = (id: string,) => {




  return `/api/appointments/${id}/cancel`
}

export const cancelAppointment = async (id: string,
    appointmentCancellationInput?: AppointmentCancellationInput, options?: Parameters<typeof customFetch>[1]): Promise<AppointmentCancellationResult> => {

  return customFetch<AppointmentCancellationResult>(getCancelAppointmentUrl(id),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(appointmentCancellationInput)
  }
);}





export const getCancelAppointmentMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelAppointment>>, TError,{id: string;data?: BodyType<AppointmentCancellationInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof cancelAppointment>>, TError,{id: string;data?: BodyType<AppointmentCancellationInput>}, TContext> => {

const mutationKey = ['cancelAppointment'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof cancelAppointment>>, {id: string;data?: BodyType<AppointmentCancellationInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  cancelAppointment(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CancelAppointmentMutationResult = NonNullable<Awaited<ReturnType<typeof cancelAppointment>>>
    export type CancelAppointmentMutationBody = BodyType<AppointmentCancellationInput> | undefined
    export type CancelAppointmentMutationError = ErrorType<unknown>

    export const useCancelAppointment = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof cancelAppointment>>, TError,{id: string;data?: BodyType<AppointmentCancellationInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof cancelAppointment>>,
        TError,
        {id: string;data?: BodyType<AppointmentCancellationInput>},
        TContext
      > => {
      return useMutation(getCancelAppointmentMutationOptions(options));
    }

export const getListServicesUrl = () => {




  return `/api/services`
}

export const listServices = async ( options?: Parameters<typeof customFetch>[1]): Promise<Service[]> => {

  return customFetch<Service[]>(getListServicesUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getListServicesQueryKey = () => {
    return [
    `/api/services`
    ] as const;
    }


export const getListServicesQueryOptions = <TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getListServicesQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof listServices>>> = ({ signal }) => listServices({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData> & { queryKey: QueryKey }
}

export type ListServicesQueryResult = NonNullable<Awaited<ReturnType<typeof listServices>>>
export type ListServicesQueryError = ErrorType<unknown>



export function useListServices<TData = Awaited<ReturnType<typeof listServices>>, TError = ErrorType<unknown>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof listServices>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getListServicesQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getCreateServiceUrl = () => {




  return `/api/services`
}

export const createService = async (serviceInput: ServiceInput, options?: Parameters<typeof customFetch>[1]): Promise<Service> => {

  return customFetch<Service>(getCreateServiceUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(serviceInput)
  }
);}





export const getCreateServiceMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError,{data: BodyType<ServiceInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError,{data: BodyType<ServiceInput>}, TContext> => {

const mutationKey = ['createService'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createService>>, {data: BodyType<ServiceInput>}> = (props) => {
          const {data} = props ?? {};

          return  createService(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateServiceMutationResult = NonNullable<Awaited<ReturnType<typeof createService>>>
    export type CreateServiceMutationBody = BodyType<ServiceInput>
    export type CreateServiceMutationError = ErrorType<unknown>

    export const useCreateService = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createService>>, TError,{data: BodyType<ServiceInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createService>>,
        TError,
        {data: BodyType<ServiceInput>},
        TContext
      > => {
      return useMutation(getCreateServiceMutationOptions(options));
    }

export const getUpdateServiceUrl = (id: string,) => {




  return `/api/services/${id}`
}

export const updateService = async (id: string,
    serviceInput: ServiceInput, options?: Parameters<typeof customFetch>[1]): Promise<Service> => {

  return customFetch<Service>(getUpdateServiceUrl(id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(serviceInput)
  }
);}





export const getUpdateServiceMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError,{id: string;data: BodyType<ServiceInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError,{id: string;data: BodyType<ServiceInput>}, TContext> => {

const mutationKey = ['updateService'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateService>>, {id: string;data: BodyType<ServiceInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  updateService(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateServiceMutationResult = NonNullable<Awaited<ReturnType<typeof updateService>>>
    export type UpdateServiceMutationBody = BodyType<ServiceInput>
    export type UpdateServiceMutationError = ErrorType<unknown>

    export const useUpdateService = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateService>>, TError,{id: string;data: BodyType<ServiceInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateService>>,
        TError,
        {id: string;data: BodyType<ServiceInput>},
        TContext
      > => {
      return useMutation(getUpdateServiceMutationOptions(options));
    }

export const getHideServiceUrl = (id: string,) => {




  return `/api/services/${id}`
}

export const hideService = async (id: string, options?: Parameters<typeof customFetch>[1]): Promise<void> => {

  return customFetch<void>(getHideServiceUrl(id),
  {
    ...options,
    method: 'DELETE'


  }
);}





export const getHideServiceMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof hideService>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof hideService>>, TError,{id: string}, TContext> => {

const mutationKey = ['hideService'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof hideService>>, {id: string}> = (props) => {
          const {id} = props ?? {};

          return  hideService(id,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type HideServiceMutationResult = NonNullable<Awaited<ReturnType<typeof hideService>>>

    export type HideServiceMutationError = ErrorType<unknown>

    export const useHideService = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof hideService>>, TError,{id: string}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof hideService>>,
        TError,
        {id: string},
        TContext
      > => {
      return useMutation(getHideServiceMutationOptions(options));
    }

export const getCreateScheduleSlotUrl = () => {




  return `/api/schedule-slots`
}

export const createScheduleSlot = async (scheduleSlotInput: ScheduleSlotInput, options?: Parameters<typeof customFetch>[1]): Promise<ScheduleSlot> => {

  return customFetch<ScheduleSlot>(getCreateScheduleSlotUrl(),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(scheduleSlotInput)
  }
);}





export const getCreateScheduleSlotMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createScheduleSlot>>, TError,{data: BodyType<ScheduleSlotInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof createScheduleSlot>>, TError,{data: BodyType<ScheduleSlotInput>}, TContext> => {

const mutationKey = ['createScheduleSlot'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof createScheduleSlot>>, {data: BodyType<ScheduleSlotInput>}> = (props) => {
          const {data} = props ?? {};

          return  createScheduleSlot(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type CreateScheduleSlotMutationResult = NonNullable<Awaited<ReturnType<typeof createScheduleSlot>>>
    export type CreateScheduleSlotMutationBody = BodyType<ScheduleSlotInput>
    export type CreateScheduleSlotMutationError = ErrorType<unknown>

    export const useCreateScheduleSlot = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof createScheduleSlot>>, TError,{data: BodyType<ScheduleSlotInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof createScheduleSlot>>,
        TError,
        {data: BodyType<ScheduleSlotInput>},
        TContext
      > => {
      return useMutation(getCreateScheduleSlotMutationOptions(options));
    }

export const getUpdateScheduleSlotUrl = (id: string,) => {




  return `/api/schedule-slots/${id}`
}

export const updateScheduleSlot = async (id: string,
    scheduleSlotInput: ScheduleSlotInput, options?: Parameters<typeof customFetch>[1]): Promise<ScheduleSlot> => {

  return customFetch<ScheduleSlot>(getUpdateScheduleSlotUrl(id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(scheduleSlotInput)
  }
);}





export const getUpdateScheduleSlotMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateScheduleSlot>>, TError,{id: string;data: BodyType<ScheduleSlotInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateScheduleSlot>>, TError,{id: string;data: BodyType<ScheduleSlotInput>}, TContext> => {

const mutationKey = ['updateScheduleSlot'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateScheduleSlot>>, {id: string;data: BodyType<ScheduleSlotInput>}> = (props) => {
          const {id,data} = props ?? {};

          return  updateScheduleSlot(id,data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateScheduleSlotMutationResult = NonNullable<Awaited<ReturnType<typeof updateScheduleSlot>>>
    export type UpdateScheduleSlotMutationBody = BodyType<ScheduleSlotInput>
    export type UpdateScheduleSlotMutationError = ErrorType<unknown>

    export const useUpdateScheduleSlot = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateScheduleSlot>>, TError,{id: string;data: BodyType<ScheduleSlotInput>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateScheduleSlot>>,
        TError,
        {id: string;data: BodyType<ScheduleSlotInput>},
        TContext
      > => {
      return useMutation(getUpdateScheduleSlotMutationOptions(options));
    }

export const getGetSettingsUrl = () => {




  return `/api/settings`
}

/**
 * @summary Read current salon settings
 */
export const getSettings = async ( options?: Parameters<typeof customFetch>[1]): Promise<Settings> => {

  return customFetch<Settings>(getGetSettingsUrl(),
  {
    ...options,
    method: 'GET'


  }
);}





export const getGetSettingsQueryKey = () => {
    return [
    `/api/settings`
    ] as const;
    }


export const getGetSettingsQueryOptions = <TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>( options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>, request?: SecondParameter<typeof customFetch>}
) => {

const {query: queryOptions, request: requestOptions} = options ?? {};

  const queryKey =  queryOptions?.queryKey ?? getGetSettingsQueryKey();



    const queryFn: QueryFunction<Awaited<ReturnType<typeof getSettings>>> = ({ signal }) => getSettings({ signal, ...requestOptions });





   return  { queryKey, queryFn, ...queryOptions} as UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData> & { queryKey: QueryKey }
}

export type GetSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getSettings>>>
export type GetSettingsQueryError = ErrorType<unknown>


/**
 * @summary Read current salon settings
 */

export function useGetSettings<TData = Awaited<ReturnType<typeof getSettings>>, TError = ErrorType<unknown>>(
  options?: { query?:UseQueryOptions<Awaited<ReturnType<typeof getSettings>>, TError, TData>, request?: SecondParameter<typeof customFetch>}

 ):  UseQueryResult<TData, TError> & { queryKey: QueryKey } {

  const queryOptions = getGetSettingsQueryOptions(options)

  const query = useQuery(queryOptions) as  UseQueryResult<TData, TError> & { queryKey: QueryKey };

  return withQueryKey(query, queryOptions.queryKey);
}







export const getUpdateSettingsUrl = () => {




  return `/api/settings`
}

export const updateSettings = async (updateSettingsBody: UpdateSettingsBody, options?: Parameters<typeof customFetch>[1]): Promise<Settings> => {

  return customFetch<Settings>(getUpdateSettingsUrl(),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(updateSettingsBody)
  }
);}





export const getUpdateSettingsMutationOptions = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError,{data: BodyType<UpdateSettingsBody>}, TContext>, request?: SecondParameter<typeof customFetch>}
): UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError,{data: BodyType<UpdateSettingsBody>}, TContext> => {

const mutationKey = ['updateSettings'];
const {mutation: mutationOptions, request: requestOptions} = options ?
      options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey ?
      options
      : {...options, mutation: {...options.mutation, mutationKey}}
      : {mutation: { mutationKey, }, request: undefined};




      const mutationFn: MutationFunction<Awaited<ReturnType<typeof updateSettings>>, {data: BodyType<UpdateSettingsBody>}> = (props) => {
          const {data} = props ?? {};

          return  updateSettings(data,requestOptions)
        }






  return  { mutationFn, ...mutationOptions }}

    export type UpdateSettingsMutationResult = NonNullable<Awaited<ReturnType<typeof updateSettings>>>
    export type UpdateSettingsMutationBody = BodyType<UpdateSettingsBody>
    export type UpdateSettingsMutationError = ErrorType<unknown>

    export const useUpdateSettings = <TError = ErrorType<unknown>,
    TContext = unknown>(options?: { mutation?:UseMutationOptions<Awaited<ReturnType<typeof updateSettings>>, TError,{data: BodyType<UpdateSettingsBody>}, TContext>, request?: SecondParameter<typeof customFetch>}
 ): UseMutationResult<
        Awaited<ReturnType<typeof updateSettings>>,
        TError,
        {data: BodyType<UpdateSettingsBody>},
        TContext
      > => {
      return useMutation(getUpdateSettingsMutationOptions(options));
    }

