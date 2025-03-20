export interface INode {
  id: string
  depth?: number
  expanded?: boolean // 노드의 펼침 여부, true: 펼침(하위 표시), false: 접힘
  subitems?: INode[]
}

// 트리 구조를 평평한 배열로 변환. EPUB 목차를 순차적으로 나열할 때 사용.(UI 컨트롤)
export function flatTree<T extends INode>(node: T, depth = 1): T[] {
  if (!node.subitems || !node.subitems.length || !node.expanded) {
    return [{ ...node, depth }] // 하위 항목 없거나 접힌 경우 현재 노드만 반환
  }
  const children = node.subitems.flatMap((i) => flatTree(i, depth + 1)) as T[]
  return [{ ...node, depth }, ...children] // 현재 노드 + 펼쳐진 하위 노드
}

// 트리에서 ID로 노드를 검색. EPUB 목차에서 특정 항목을 찾을 때 유용.
export function find<T extends INode>(
  nodes: T[] = [],
  id: string,
): T | undefined {
  const node = nodes.find((n) => n.id === id)
  if (node) return node
  for (const child of nodes) {
    const node = find(child.subitems, id)
    if (node) return node as T
  }
  return undefined
}

// 트리를 깊이 우선 탐색(DFS)으로 순회. 목차 항목을 순차 처리할 때 사용.
export function dfs<T extends INode>(node: T, fn: (node: T) => void) {
  fn(node)
  node.subitems?.forEach((child) => dfs(child as T, fn))
}
