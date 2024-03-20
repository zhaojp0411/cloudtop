import { StatParams } from '../../../types'
import { LogType } from '../../../types/log'
import { ElasticBoolMust } from '../../../utils/elastic_bool'
import { ApiData } from '../../../utils/response'
import { count } from '../../elastic'

const getData = ({
  projectCode,
  projectEnv,
  startTime,
  endTime,
}: StatParams) => {
  const must = new ElasticBoolMust()
    .addMatch('pid', projectCode)
    .addMatch('env', projectEnv)
    .addRange('date', {
      gte: +startTime,
      lte: +endTime,
    })

  const query = {
    bool: {
      must: must.values(),
    },
  }

  const aggs = {
    stats: {
      terms: {
        field: 'ip_region_name.keyword',
        size: 1000,
      },
      aggs: {
        uv: {
          cardinality: {
            field: 'uid.keyword',
          },
        },
      },
    },
  }

  return count({ query, aggs })
}

export const territoryUserStat = async (params: StatParams) => {
  const { stats } = await getData(params)
  const result = stats.buckets.map((i: Record<string, any>) => ({
    key: i.key,
    value: i.uv.value,
  }))

  return new ApiData(0, 'OK', result)
}
