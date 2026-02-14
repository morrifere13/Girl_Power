import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { API_BASE_URL } from '../services/api'

// Helper to load image as Base64
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg'))
    }
    img.onerror = (e) => {
      console.error('Image load error', e)
      resolve(null) // Return null on error so PDF continues without image
    }
  })
}

export const exportCandidateToPDF = async (candidate) => {
  const doc = new jsPDF()
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15

  // --- COLORS & FONTS ---
  const colorPrimary = [31, 41, 55] // Gray-800 - Formal dark
  const colorAccent = [231, 76, 100] // Girl Power Red
  const colorLight = [249, 250, 251] // Gray-50

  doc.setFont('helvetica', 'normal')

  // --- HEADER ---
  // Administrative Header Left
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('REPUBLIQUE DE COTE D\'IVOIRE', margin, 20)
  doc.setFontSize(8)
  doc.text('Union - Discipline - Travail', margin + 6, 25)

  // Title Center
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...colorAccent)
  doc.text('FICHE DE RENSEIGNEMENTS', pageWidth / 2, 22, { align: 'center' })
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('PROGRAMME GIRL POWER', pageWidth / 2, 28, { align: 'center' })

  // Photo Placeholder Right
  const photoSize = 35
  const photoX = pageWidth - margin - photoSize
  const photoY = 15

  // Load Photo if exists
  if (candidate.photo) {
    try {
      const photoUrl = `${API_BASE_URL}${candidate.photo}`
      const photoData = await loadImage(photoUrl)
      if (photoData) {
        doc.addImage(photoData, 'JPEG', photoX, photoY, photoSize, photoSize)
        // Add border around photo
        doc.setDrawColor(200, 200, 200)
        doc.rect(photoX, photoY, photoSize, photoSize)
      } else {
        // Fallback box
        doc.setDrawColor(200, 200, 200)
        doc.rect(photoX, photoY, photoSize, photoSize)
        doc.setFontSize(8)
        doc.text('Photo', photoX + 12, photoY + 18)
      }
    } catch (err) {
      console.error('Error loading photo for PDF', err)
    }
  } else {
    // Empty box
    doc.setDrawColor(200, 200, 200)
    doc.rect(photoX, photoY, photoSize, photoSize)
    doc.setFontSize(8)
    doc.text('Photo', photoX + 12, photoY + 18)
  }

  // Draw Horizontal Line
  doc.setDrawColor(...colorAccent)
  doc.setLineWidth(0.5)
  doc.line(margin, 55, pageWidth - margin, 55)

  let yPos = 65

  // Helper for Section Titles
  const addSectionTitle = (title, y) => {
    doc.setFillColor(...colorLight)
    doc.rect(margin, y - 6, pageWidth - (margin * 2), 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(title.toUpperCase(), margin + 2, y)
    return y + 10
  }

  // Helper for Key-Value Rows
  const addRow = (label, value, x, y, labelWidth = 50) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(label + ':', x, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(String(value || '-'), x + labelWidth, y)
  }

  // --- 1. ETAT CIVIL ---
  yPos = addSectionTitle('1. ETAT CIVIL', yPos)

  const col1 = margin + 5
  const col2 = 110 // Second column start in grid

  addRow('Nom', candidate.nom, col1, yPos)
  addRow('Prénoms', candidate.prenom, col2, yPos)
  yPos += 7

  addRow('Date Naissance', new Date(candidate.date_naissance).toLocaleDateString('fr-FR'), col1, yPos)
  addRow('Lieu', candidate.lieu_naissance, col2, yPos)
  yPos += 7

  addRow('Sexe', candidate.sexe === 'F' ? 'Féminin' : 'Masculin', col1, yPos)
  addRow('Statut', candidate.statut, col2, yPos)
  yPos += 7

  addRow('Type Doc', candidate.type_document || '-', col1, yPos)
  addRow('Numéro Doc', candidate.numero_document || '-', col2, yPos)
  yPos += 10 // Spacing

  // --- 2. COORDONNEES & LOCALISATION ---
  yPos = addSectionTitle('2. COORDONNEES & LOCALISATION', yPos)

  addRow('Téléphone 1', candidate.telephone, col1, yPos)
  addRow('Téléphone 2', candidate.telephone_2 || '-', col2, yPos)
  yPos += 7

  addRow('Région', candidate.region, col1, yPos)
  addRow('Ville/Localité', candidate.ville, col2, yPos)
  yPos += 7

  addRow('Quartier', candidate.quartier, col1, yPos)
  addRow('Repère', candidate.repere_logement, col2, yPos)
  yPos += 10

  // --- 3. FORMATION & PROJET ---
  yPos = addSectionTitle('3. FORMATION & PROJET PROFESSIONNEL', yPos)

  addRow('Niveau Etude', candidate.niveau_etude, col1, yPos)
  addRow('Dernier Diplôme', candidate.diplome || 'Aucun', col2, yPos)
  yPos += 7

  addRow('Activité Actuelle', candidate.activite_actuelle, col1, yPos)
  addRow('Métier Choisi', candidate.metier_choisi || '-', col2, yPos)
  yPos += 10

  // --- 4. FAMILLE & URGENCE ---
  yPos = addSectionTitle('4. FAMILLE & PERSONNES A CONTACTER', yPos)

  addRow('Situation', candidate.situation_matrimoniale, col1, yPos)
  addRow('Enfants en charge', candidate.nombre_enfants_charge || '0', col2, yPos)
  yPos += 7

  // Parents
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Filiation:', col1, yPos)
  yPos += 5

  addRow('Père', candidate.pere_nom, col1, yPos)
  addRow('Contact Père', candidate.pere_contact1, col2, yPos)
  yPos += 6

  addRow('Mère', candidate.mere_nom, col1, yPos)
  addRow('Contact Mère', candidate.mere_contact1, col2, yPos)
  yPos += 8

  // Urgence
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('En cas d\'urgence:', col1, yPos)
  yPos += 5

  addRow('Nom Contact', candidate.urgence_nom, col1, yPos)
  addRow('Téléphone', candidate.urgence_contact1, col2, yPos)
  yPos += 15


  // --- FOOTER / SIGNATURE ZONE ---

  // Draw box for signature
  const sigY = 240
  doc.setDrawColor(150, 150, 150)
  doc.rect(130, sigY, 60, 30) // Box for signature
  doc.setFontSize(8)
  doc.text('Signature / Cachet', 135, sigY + 5)


  // Footer Text
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Fiche générée automatiquement par la plateforme Girl Power.', pageWidth / 2, 285, { align: 'center' })
  doc.text(`Date d'impression: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 289, { align: 'center' })

  // Save PDF
  const fileName = `${candidate.nom}_${candidate.prenom}_Fiche.pdf`
  doc.save(fileName)
}
