For the categories

Url: https://search.mena.sector.run/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.suggest.*.options.text%2C*.suggest.*.options._source.*%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.hits.hits.highlight.*%2C*.error%2C*.aggregations.*.buckets.key%2C*.aggregations.*.buckets.doc_count%2C*.aggregations.*.buckets.complex_value.hits.hits._source%2C*.aggregations.*.filtered_agg.facet.buckets.key%2C*.aggregations.*.filtered_agg.facet.buckets.doc_count%2C*.aggregations.*.filtered_agg.facet.buckets.complex_value.hits.hits._source

Method: POSt

Auth:
Username: olx-lb-production-search
Password: >s+O3=s9@I4DF0Ia%ug?7QPuy2{Dj[Fr

Body Raw
{"index":"olx-lb-production-ads-en"}
{"size":50,"collapse":{"field":"category.lvl0.externalID"},"\_source":["category.lvl0"]}

For locations + count
Need to map the locaiton name and their count
{"index":"olx-lb-production-ads-en"}
{"size":0,"query":{"bool":{"filter":[{"term":{"location.lvl0.externalID":"0-1"}}]}},"aggs":{"locations_counts":{"terms":{"field":"location.lvl1.externalID","size":20}}}}
{"index":"olx-lb-production-locations-en"}
{"size":20,"query":{"bool":{"must":[{"term":{"level":1}}]}},"\_source":["externalID","name"]}

For location + sub location
{"index":"olx-lb-production-ads-en"}
{"size":0,"query":{"bool":{"filter":[{"term":{"location.lvl1.externalID":"1-30"}}]}},"aggs":{"sub_locations":{"terms":{"field":"location.lvl2.externalID","size":50}}}}
{"index":"olx-lb-production-locations-en"}
{"size":500,"query":{"bool":{"must":[{"terms":{"externalID":["2-101","2-162","2-505","2-90","2-92","2-93","2-224","2-106","2-192","2-118"]}}]}},"\_source":["externalID","name"]}

https://search.mena.sector.run/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.suggest.*.options.text%2C*.suggest.*.options._source.*%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.hits.hits.highlight.*%2C*.error%2C*.aggregations.*.buckets.key%2C*.aggregations.*.buckets.doc_count%2C*.aggregations.*.buckets.complex_value.hits.hits._source%2C*.aggregations.*.filtered_agg.facet.buckets.key%2C*.aggregations.*.filtered_agg.facet.buckets.doc_count%2C*.aggregations.*.filtered_agg.facet.buckets.complex_value.hits.hits._source

Children categories of a parent Category
{"index":"olx-lb-production-ads-en"}
{"size":0,"aggs":{"main_categories":{"terms":{"field":"category.lvl0.externalID","size":20}}}}
{"index":"olx-lb-production-ads-en"}
{"size":50,"collapse":{"field":"category.lvl0.externalID"},"\_source":["category.lvl0"]}

Ads for a spec category
{"index":"olx-lb-production-ads-en"}
{"from":0,"size":20,"track_total_hits":true,"query":{"bool":{"must":[{"term":{"category.lvl0.externalID":"129"}}]}},"sort":[{"timestamp":{"order":"desc"}}]}

Ads in a specific location ex 1-30 is beirut

{"index":"olx-lb-production-ads-en"}
{"from":0,"size":20,"track_total_hits":true,"query":{"bool":{"must":[{"term":{"location.externalID":"1-30"}}]}},"sort":[{"timestamp":{"order":"desc"}}]}

Ads in specific category and specific location

with slug
{"index":"olx-lb-production-ads-en"}
{"from":0,"size":20,"track_total_hits":true,"query":{"bool":{"must":[{"term":{"location.externalID":"1-30"}},{"term":{"category.slug":"vehicles"}}]}},"sort":[{"timestamp":{"order":"desc"}}]}

with id
{"index":"olx-lb-production-ads-en"}
{"from":0,"size":20,"track_total_hits":true,"query":{"bool":{"must":[{"term":{"location.externalID":"2-101"}},{"term":{"category.lvl0.externalID":"129"}}]}},"sort":[{"timestamp":{"order":"desc"}}]}
