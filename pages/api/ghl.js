
const GHL_KEY     = 'pit-703f91cc-dcdd-4fb4-a6a9-8a2950234dbb'
const LOCATION_ID = 'wNOUTDaV8CtZTLNfuhSL'

const REP_PIPELINES = [
  { rep: 'Arkane',  id: '7HdiSynMqNep24Itjeem',  stages: { followUp:'87ec6de9-b6a6-4e8f-9a56-284036b85035', docsAcq:'a45cdb9b-afba-4906-8ade-da4d526d3769', signedUp:'b1047e15-3e5a-4664-b644-e4addf774626', payable:'71b397a2-8c41-4217-a2ee-b327b6e81b74', badTiming:'36339694-0899-4fc1-934c-3282b6364201', notInterested:'dea91ba8-5b68-49bc-be32-0b1eec8d65b7', dq:'83972563-574e-41a5-b38b-9e193f816dd5' }},
  { rep: 'Khaled',  id: 'm91jIhjWx6ird9ygpUfk',  stages: { followUp:'c92df96e-97f7-45fd-a63d-58c204b59282', docsAcq:'8e192221-059d-43ba-8589-d1bcc782ff1d', signedUp:'b7e20054-9199-4ad9-83dc-eee9c4cdf6be', payable:'31d15098-cef1-4b26-9431-c18d44b40cfd', badTiming:'7f6bf11f-3224-4276-94fb-97bb6403115e', notInterested:'3391388d-0620-4dae-9ea0-a1c4217753f5', dq:'e0214c25-e972-4b22-9147-3e3cb5ffb575' }},
  { rep: 'Aaron',   id: 'qEIcA3MllotEaq82j1Ec',  stages: { followUp:'85cc1010-50af-4256-ba26-0ca7504f5408', docsAcq:'2a330043-0735-4b6e-ae39-8e1b10ed2dab', signedUp:'a4c92f32-cb52-4be5-a430-25d80ee75a2c', payable:'afea47c2-ddb9-420f-a66f-72e351c17c69', badTiming:'82d79984-76cc-46b4-9ce1-280aa0d466fd', notInterested:'cd3f0d7a-7616-4b35-82ae-d3b6078c7b21', dq:'4f7fa42f-6048-42b9-8e0f-632bdd85a609' }},
  { rep: 'Khyron',  id: 'lmFPtdC8GvuCjQj5MAI8',  stages: { followUp:'fab29189-555f-4ecf-84e3-7cb4894bb437', docsAcq:'c70e1aab-2ea6-496d-a314-d1776c8baa24', signedUp:'55c0455b-9bb2-45b3-8ca1-c245fcdeaafb', payable:null,                                           badTiming:'585c6f8d-76b6-439a-9c9f-9d60b57e928d', notInterested:'79ad9a2c-1b73-497b-9772-8b5cf7f01461', dq:'ebac222a-4b18-4d5f-ba65-072f83c76485' }},
  { rep: 'Leon',    id: 'c3MDdCD1UebuZngpV3wU',  stages: { followUp:'b07033ab-1c5d-41a2-b745-5d2d797bd5ca', docsAcq:'5b70638d-b2e2-4a2b-a0c0-5478f842f38e', signedUp:'993a08b9-cede-4ba6-929f-d74c6e6a3aa1', payable:'22b56479-aecc-44b0-967a-fb6d99623046', badTiming:'fee37c92-b059-466b-b481-1d6bd482c70d', notInterested:'e8300ecc-7006-42ce-b23f-1687beae02bf', dq:'0c32fd98-a1a1-4891-a369-fce746ec5157' }},
  { rep: 'Fadi',    id: 'wBAt5axhk3pTloIp0eDt',  stages: { followUp:'ec6d0572-2ccf-4e42-ad5f-b57f1aca1b60', docsAcq:'9bd3f7ba-e127-4dac-ac3e-bf46351adecb', signedUp:'45c2deaf-9ec6-485c-90c4-1b26930ab6c4', payable:null,                                           badTiming:'a5b8dbe9-36ca-49fe-9c06-ccb3680fb03c', notInterested:'3316780f-0e5c-4f3c-87f9-3f112f929ff0', dq:'443870d3-ed01-400d-ab91-f9ddb8f95b6a' }},
  { rep: 'Marley',  id: 'Kei5qbNi7iieFdmuwPXu',  stages: { followUp:'6fb347cc-2f21-4671-a9af-782e3bf5ef77', docsAcq:'39934d9e-5457-4193-8619-63c589309bdf', signedUp:'5fd17850-de60-49df-9508-ee3b69fe8368', payable:null,                                           badTiming:'c8cec34c-acce-4ef6-a614-1be91df01886', notInterested:'e0c6c1f8-3174-431a-a75e-ec7651dd85a2', dq:'9cd218d3-42be-46bc-b1cf-cbfc6c4fcb36' }},
  { rep: 'Jamie',   id: 'BsXboALC5Rtp2KoXxbY2',  stages: { followUp:'a01d3042-0146-4cb4-ae3a-c8f036d1b7b3', docsAcq:'94643892-aa8e-4d8c-b6a7-d0f311912c40', signedUp:'c980a6e5-55ce-4aa7-91ed-0e8ed5327f80', payable:null,                                           badTiming:'c6931d4b-8959-4135-8c64-ebdbb60ac312', notInterested:'ef03e3b5-e1b3-4927-8914-4a8c5d08670f', dq:'67567eb3-e2a4-410f-87d0-2595852750d9' }},
  { rep: 'Raine',   id: 'poLVvLUWf30SROqSD3IZ',  stages: { followUp:'e6c9d966-1d3f-403f-97d6-d89cf6500a37', docsAcq:'d65b05fb-5e2f-4362-b8f2-b986192657ea', signedUp:null,                                          payable:null,                                           badTiming:'732f5a92-e010-4577-ac2c-c09191330dca', notInterested:'76bcecaa-85b4-4c19-a07d-1248d245aab5', dq:'d1ff57d7-abe8-48da-8214-dfc667c99b44' }},
]

const LEAD_HUB_ID = 'YPi3C8gsJXjTkQrUqctW'

async function fetchAllOpps(pipelineId) {
  let all = []
  let page = 1
  while (true) {
    const res = await fetch(
      `https://services.leadconnectorhq.com/opportunities/search?location_id=${LOCATION_ID}&pipeline_id=${pipelineId}&limit=100&page=${page}`,
      { headers: { 'Authorization': `Bearer ${GHL_KEY}`, 'Version': '2021-07-28' } }
    )
    const data = await res.json()
    const opps = data.opportunities || []
    all = all.concat(opps)
    const total = data.meta?.total || 0
    if (all.length >= total || opps.length === 0) break
    page++
  }
  return all
}

export default async function handler(req, res) {
  try {
    // Fetch all pipelines in parallel
    const [leadHubOpps, ...repOppsArrays] = await Promise.all([
      fetchAllOpps(LEAD_HUB_ID),
      ...REP_PIPELINES.map(p => fetchAllOpps(p.id))
    ])

    // Lead Hub stats
    const leadHub = {
      total:       leadHubOpps.length,
      aiActive:    leadHubOpps.filter(o => o.status === 'open').length,
    }

    // Rep stats
    const repStats = REP_PIPELINES.map((pipeline, i) => {
      const opps = repOppsArrays[i]
      const stageIds = pipeline.stages
      const count = (id) => id ? opps.filter(o => o.pipelineStageId === id).length : 0

      const followUp      = count(stageIds.followUp)
      const docsAcq       = count(stageIds.docsAcq)
      const signedUp      = count(stageIds.signedUp)
      const payable       = count(stageIds.payable)
      const badTiming     = count(stageIds.badTiming)
      const notInterested = count(stageIds.notInterested)
      const dq            = count(stageIds.dq)
      const total         = opps.length
      const active        = followUp + docsAcq + signedUp + badTiming

      return {
        rep: pipeline.rep,
        total, active, followUp, docsAcq, signedUp,
        payable, badTiming, notInterested, dq,
      }
    })

    // Leaderboard sorted by signed up
    repStats.sort((a, b) => b.signedUp - a.signedUp)

    res.status(200).json({ repStats, leadHub })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
