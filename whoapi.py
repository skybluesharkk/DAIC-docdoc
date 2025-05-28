import requests, pprint
url = ("https://apps.who.int/gho/athena/api/GHO/TB_incidence"
       "?filter=COUNTRY:IND;YEAR:2022;SEX:Both&format=json&profile=simple")
r = requests.get(url, headers={"Accept": "application/json"})
print(r.status_code, r.headers["Content-Type"])
pprint.pp(r.json())
