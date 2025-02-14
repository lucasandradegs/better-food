import { Button } from '@/components/ui/button'

interface CategoryFilterProps {
  categories?: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({
  categories = [],
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  console.log(categories)
  return (
    <div className="-mx-4 mb-8 px-4 sm:mx-0 sm:px-0">
      <div className="scrollbar-hide flex overflow-x-auto sm:flex-wrap">
        <div className="flex space-x-2 pb-4 sm:flex-wrap sm:gap-2 sm:space-x-0 sm:pb-0">
          <Button
            key="todos"
            variant={selectedCategory === 'Todos' ? 'default' : 'outline'}
            className="flex-shrink-0 dark:bg-[#262626] dark:hover:bg-[#363636]"
            onClick={() => onCategoryChange('Todos')}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="flex-shrink-0 dark:bg-[#262626] dark:hover:bg-[#363636]"
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
