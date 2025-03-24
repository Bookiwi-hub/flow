module.exports = {
  // plugins: Prettier에 추가 기능을 제공하는 플러그인을 지정합니다.
  // 여기서는 'prettier-plugin-tailwindcss'를 사용하여 Tailwind CSS 클래스를 자동으로 정렬합니다.
  plugins: [require('prettier-plugin-tailwindcss')],

  // singleQuote: true - 문자열에 작은따옴표(')를 사용하도록 설정합니다.
  // 예: "Hello" -> 'Hello'
  singleQuote: true,

  // semi: false - 문장 끝에 세미콜론(;)을 붙이지 않도록 설정합니다.
  // 예: const name = 'Alice'; -> const name = 'Alice'
  semi: false,

  // trailingComma: 'all' - 배열이나 객체의 마지막 요소 뒤에 쉼표(,)를 붙입니다.
  // 이는 코드 가독성을 높이고, git diff를 깔끔하게 유지하는 데 유용합니다.
  // 예: const fruits = ['apple', 'banana'] -> const fruits = ['apple', 'banana',]
  trailingComma: 'all',
}
