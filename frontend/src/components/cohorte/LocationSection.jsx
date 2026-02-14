/**
 * Section de localisation avec sélection multiple
 * Principe SOLID: Single Responsibility - Gère une seule catégorie de localisation
 * Principe SOLID: Open/Closed - Configurable via props
 */
import CheckboxGrid from './CheckboxGrid'

/**
 * @typedef {Object} LocationSectionProps
 * @property {string} title - Titre de la section
 * @property {string} icon - Emoji ou icône
 * @property {Array<string>} items - Liste des valeurs disponibles
 * @property {Array<string>} selectedItems - Valeurs sélectionnées
 * @property {(value: string) => void} onToggle - Callback de toggle
 * @property {() => void} onSelectAll - Sélectionner tout
 * @property {() => void} onDeselectAll - Désélectionner tout
 * @property {boolean} isAllSelected - Toutes les valeurs sont sélectionnées
 * @property {string} colorScheme - Schéma de couleur
 * @property {boolean} [loading=false] - Chargement en cours
 * @property {boolean} [disabled=false]
 */

const COLOR_BUTTON_CLASSES = {
  blue: 'text-blue-600 hover:text-blue-700',
  orange: 'text-orange-600 hover:text-orange-700',
  green: 'text-green-600 hover:text-green-700',
  purple: 'text-purple-600 hover:text-purple-700'
}

export default function LocationSection({
  title,
  icon,
  items = [],
  selectedItems = [],
  onToggle,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  colorScheme = 'blue',
  loading = false,
  disabled = false
}) {
  const buttonColorClass = COLOR_BUTTON_CLASSES[colorScheme] || COLOR_BUTTON_CLASSES.blue

  // Transforme les strings en objets pour CheckboxGrid
  const gridItems = items.map(item => ({
    id: item,
    label: item
  }))

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-bold text-gray-700">
          {icon} {title}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            disabled={disabled || loading || items.length === 0}
            className={`
              text-xs font-medium underline
              ${disabled || loading ? 'opacity-50 cursor-not-allowed' : buttonColorClass}
            `}
          >
            {isAllSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {selectedItems.length}/{items.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-500">Chargement...</span>
        </div>
      ) : (
        <CheckboxGrid
          items={gridItems}
          selectedIds={selectedItems}
          onToggle={onToggle}
          colorScheme={colorScheme}
          disabled={disabled}
          emptyMessage={`Aucun(e) ${title.toLowerCase()} disponible`}
          columns={4}
        />
      )}
    </div>
  )
}
