'use strict'

let table = {}

function preprocess(text) {
  let groups

  // preprocess optional groups in square brakets
  // $s = the [blue|red] shoes
  // =>
  // $s = the $_optgrp0 shoes
  // $_optgrp0 = | (blue|red)
  groups = []
  while (true) {
    let end = true
    text = text.replace(
      /\[([^\[\]]*)\]/,
      (s, p1) => {
        const n = groups.length
        end = false
        groups.push(`$_optgrp${n} = | (${p1})`)
        return `$_optgrp${n}`
      }
    )
    if (end) break
  }
  text += ";\n" + groups.join(";\n")

  // preprocess groups in round brakets
  // $s = the (blue|red) shoes
  // =>
  // $s = the $_grp0 shoes
  // $_grp0 = blue|red
  groups = []
  while (true) {
    let end = true
    text = text.replace(
      /\(([^\(\)]*)\)/,
      (s, p1) => {
        const n = groups.length
        end = false
        groups.push(`$_grp${n} = ${p1}`)
        return `$_grp${n}`
      }
    )
    if (end) break
  }
  text += ";\n" + groups.join(";\n")

  return text
}

function build_table(text) {
  const t = {}

  text.split(';').forEach(line => {

    line = line.replaceAll('\n', ' ');
    line = line.trim()

    if (!line) return
    if (line[0] == '#') return

    let [symbol, content] = line.split(/ *= *(.*)/)

    if (symbol[0] !== "$") throw `Invalid symbol name: ${symbol}, must start with $`
    if (!content) throw `No content for symbol ${symbol}`

    t[symbol] = content

  })

  if (!('$s' in t)) throw "Missing starting symbol: $s"

  return t
}


function visit(symbol) {
  if (!(symbol in table)) throw `Cannot visit undefined symbol ${symbol}`

  return getRandomElement(
    table[symbol].split("|")
  ).trim(
  ).replaceAll(
    /\$[\p{L}0-9_]+/ug,
    s => visit(s)
  )
  // https://stackoverflow.com/a/48902765/440172

}

function generate() {
  document.querySelector(
    '#output'
  ).innerHTML = visit('$s').replaceAll( // no-space concat
    /\s*\^\s*/g,
    ""
  ).replaceAll( // uppercase letter after backslash
    /\\\s*([^\s])/g,
    (m, p1) => p1.toLocaleUpperCase()
  )
}

function getRandomElement(arr) {
  return arr[
    getRandomInt(
      0,
      arr.length
    )
  ]
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
  //The maximum is exclusive and the minimum is inclusive
}

document.addEventListener("DOMContentLoaded", () => {
  table = build_table(
    preprocess(
      document.querySelector('#code').value
    )
  )
  console.table(table)
  generate()
})
