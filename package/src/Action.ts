import { CrudActions } from './types/types'
import type { ActionConfig, ActionContext } from './types/types'

export default class Action {
  private readonly config: ActionConfig

  constructor(config: ActionConfig) {
    this.config = config
  }

  /**
   * Execute the action, making an API call and handling success and error cases.
   * @param {ActionContext} context - The Vuex context object for state and commit function.
   * @param {any} actionData - Data to be used in the action.
   */
  async execute({ commit }: ActionContext, actionData: any) {
    const {
      loadingMutation,
      generateAxiosRequestConfig,
      actionType,
      resourceName,
      axios,
      commitState,
      mutationName,
      handleActionSuccess,
      handleActionError
    } = this.config

    commit(loadingMutation.name, { data: true })

    const { dataMapper, stateMapper, method, url, params, data } =
      generateAxiosRequestConfig(resourceName.original, actionType, actionData)

    try {
      const res = await axios({ method, url, params, data })
      if (commitState)
        commit(mutationName, { data: stateMapper(res.data), actionData })
      handleActionSuccess(
        actionType,
        stateMapper(res.data),
        resourceName.original
      )
      return dataMapper(res.data)
    } catch (err) {
      handleActionError(actionType, err, resourceName.original)
    } finally {
      commit(loadingMutation.name, { data: false })
    }
  }

  isAction(type: any) {
    return [
      CrudActions.deleteItem,
      CrudActions.updateItem,
      CrudActions.createItem
    ].includes(type)
  }

  get state() {
    const { loadingMutation } = this.config

    return {
      [loadingMutation.state]: null
    }
  }

  get actions() {
    const { actionName } = this.config

    return {
      [actionName]: (...args: [ActionContext, any]) => {
        return this.execute(...args)
      }
    }
  }

  get mutations() {
    const { loadingMutation } = this.config

    return {
      [loadingMutation.name]: function (state: any, { data }: any) {
        state[loadingMutation.state] = Boolean(data)
      }
    }
  }
}
