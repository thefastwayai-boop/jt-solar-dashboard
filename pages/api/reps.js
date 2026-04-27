export default async function handler(req, res) {
  const SHEET_ID = '1nYfkq9lTgqAyPQnsu35mT5r7RAs6U61S8_zYBMp78E0'
  const CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`

  try {
    const response = await fetch(CSV_URL)
    if (!response.ok) throw new Error('Failed to fetch sheet')
    const text = await response.text()

    const rows = text.trim().split('\n').map(row =>
      row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim())
    )

    // Skip header, only keep rows that start with a month name (data rows)
    const dataRows = rows.slice(1).filter(row =>
      (row[0] || '').match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)
    )

    const records = dataRows.map(row => ({
      week:      row[0] || '',
      rep:       row[1] || '',
      leads:     parseInt(row[2])   || 0,
      contacts:  parseInt(row[3])   || 0,
      signups:   parseInt(row[4])   || 0,
      docsAcq:   parseInt(row[5])   || 0,
      followUps: parseInt(row[6])   || 0,
      signupKwh: parseFloat(row[7]) || 0,
      docsKwh:   parseFloat(row[8]) || 0,
    }))

    const reps  = [...new Set(records.map(r => r.rep))].filter(Boolean)
    const weeks = [...new Set(records.map(r => r.week))]

    const repStats = reps.map(rep => {
      const repRows = records.filter(r => r.rep === rep)
      const totals  = repRows.reduce((acc, r) => ({
        leads:     acc.leads     + r.leads,
        contacts:  acc.contacts  + r.contacts,
        signups:   acc.signups   + r.signups,
        docsAcq:   acc.docsAcq  + r.docsAcq,
        followUps: acc.followUps + r.followUps,
        signupKwh: acc.signupKwh + r.signupKwh,
        docsKwh:   acc.docsKwh  + r.docsKwh,
      }), { leads: 0, contacts: 0, signups: 0, docsAcq: 0, followUps: 0, signupKwh: 0, docsKwh: 0 })

      return {
        rep,
        ...totals,
        totalKwh:    totals.signupKwh + totals.docsKwh,
        contactRate: totals.leads    > 0 ? totals.contacts / totals.leads    : 0,
        signupRate:  totals.contacts > 0 ? totals.signups  / totals.contacts : 0,
        weeklyData:  weeks.map(week => {
          const row = repRows.find(r => r.week === week) || {}
          return {
            week,
            leads:    row.leads    || 0,
            contacts: row.contacts || 0,
            signups:  row.signups  || 0,
            docsAcq:  row.docsAcq  || 0,
            kwh:     (row.signupKwh || 0) + (row.docsKwh || 0),
          }
        })
      }
    })

    res.status(200).json({ repStats, weeks, records })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
