'use strict'

class Polygen {

  constructor(grammar) {
    this.table = this.build_table(
      this.preprocess(
        grammar
      )
    )
  }

  build_table(text) {
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

  preprocess(text) {
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

  postprocess(text) {
    return text
    .replaceAll(/\s+/g, " ") // strip multiple spaces
    .replaceAll(/\s([.,;:?!])/g, "$1") // strip spaces before punctuation
    .replaceAll( // no-space concatenation with ^
      /\s*\^\s*/g,
      ""
    ).replaceAll( // uppercase letter after backslash
      /\\\s*([^\s])/g,
      (m, p1) => p1.toLocaleUpperCase()
    )
  }

  generate() {
    return this.postprocess(
      this.visit('$s')
    )
  }

  visit(symbol) {
    if (!(symbol in this.table)) throw `Cannot visit undefined symbol ${symbol}`

    return this.getRandomElement(
      this.table[symbol].split("|")
    ).trim(
    ).replaceAll(
      /\$[\p{L}0-9_]+/ug,
      s => this.visit(s)
    )
    // https://stackoverflow.com/a/48902765/440172
  }

  getRandomElement(arr) {
    return arr[
      this.getRandomInt(
        0,
        arr.length
      )
    ]
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
    //The maximum is exclusive and the minimum is inclusive
  }

}

// --

document.addEventListener("DOMContentLoaded", () => {

  const display_new = (p) => {
    document.querySelector(
      '#output'
    ).innerHTML = p.generate()
  }

  const p = new Polygen(
    document.querySelector('#code').value
  );

  console.table(p.table);

  display_new(p);

  document.querySelector("#generi").addEventListener("click", () => {
    display_new(p);
  })

})
