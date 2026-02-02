"""
PDF generation service for orders.
"""
import io
import os
from decimal import Decimal
from datetime import date

from django.conf import settings
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT



def generate_order_pdf(order):
    """
    Generate a PDF document for an order.
    
    Args:
        order: Order instance with items
    
    Returns:
        BytesIO buffer containing the PDF
    """
    buffer = io.BytesIO()
    
    # Create document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='BusinessName',
        parent=styles['Heading1'],
        fontSize=20,
        alignment=TA_CENTER,
        spaceAfter=10
    ))
    styles.add(ParagraphStyle(
        name='BusinessInfo',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.gray
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading2'],
        fontSize=12,
        spaceAfter=10,
        spaceBefore=20
    ))
    styles.add(ParagraphStyle(
        name='CustomerInfo',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        name='HeaderBusinessName',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=5
    ))
    styles.add(ParagraphStyle(
        name='HeaderBusinessInfo',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.gray
    ))
    styles.add(ParagraphStyle(
        name='Total',
        parent=styles['Normal'],
        fontSize=14,
        alignment=TA_RIGHT,
        fontName='Helvetica-Bold',
        spaceBefore=20
    ))
    
    # Build content
    elements = []
    
    # Path to logo
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    LOGO_PATH = os.path.join(BASE_DIR, 'assets', 'images', 'Logo_Servicio.png')
    
    # Business info
    business_name = getattr(settings, 'BUSINESS_NAME', 'Alquileres "El Grillo"')
    business_address = getattr(settings, 'BUSINESS_ADDRESS', '')
    business_phone = getattr(settings, 'BUSINESS_PHONE', '')
    
    # Build header with logo on left, business info on right
    header_data = []
    
    # Logo cell
    if os.path.exists(LOGO_PATH):
        try:
            logo = Image(LOGO_PATH, width=3.5*cm, height=3.5*cm, kind='proportional')
            logo_cell = logo
        except Exception:
            logo_cell = Paragraph("", styles['Normal'])
    else:
        logo_cell = Paragraph("", styles['Normal'])
    
    # Business info cell (multiple paragraphs in a list)
    business_info = []
    business_info.append(Paragraph(business_name, styles['HeaderBusinessName']))
    if business_address:
        business_info.append(Paragraph(f"Dir: {business_address}", styles['HeaderBusinessInfo']))
    if business_phone:
        business_info.append(Paragraph(f"Tel: {business_phone}", styles['HeaderBusinessInfo']))
    
    header_data.append([logo_cell, business_info])
    
    header_table = Table(
    [[logo_cell, business_info]],
    colWidths=[4*cm, doc.width - 4*cm]
    )

    header_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (0, 0), 'LEFT'),
    ('ALIGN', (1, 0), (1, 0), 'CENTER'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

#    header_table = Table(header_data, colWidths=[5*cm, 10*cm])
#    header_table.setStyle(TableStyle([
#        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
#        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
#        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
#        ('LEFTPADDING', (0, 0), (-1, -1), 0),
#        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
#    ]))
    
    elements.append(header_table)
    elements.append(Spacer(1, 10))
#    elements.append(Spacer(1, 0.5*cm))

    # Linea horizontal
    elements.append(Table(
        [['']],
        colWidths=[doc.width],
        rowHeights=[1],
        style=[('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey)]
    ))
    elements.append(Spacer(1, 14))


    # Order number and date
    elements.append(Paragraph(
        f"<b>Pedido #</b> {order.id}",
        styles['Heading2']
    ))
    
    local_datetime = timezone.localtime(order.created_at)
    elements.append(Paragraph(
        f"Fecha: {local_datetime.strftime('%d/%m/%Y %H:%M')}",
        styles['Normal']
    ))
    
    elements.append(Spacer(1, 0.5*cm))
    
    # Customer info
    elements.append(Paragraph("<u>Datos del Cliente:</u>", styles['SectionTitle']))
    elements.append(Paragraph(f"<b>Nombre:</b> {order.customer_name}", styles['CustomerInfo']))
    if order.customer_phone:
        elements.append(Paragraph(f"<b>Teléfono:</b> {order.customer_phone}", styles['CustomerInfo']))
    if order.customer_address:
        elements.append(Paragraph(f"<b>Dirección:</b> {order.customer_address}", styles['CustomerInfo']))
    
    # Event dates
    elements.append(Paragraph("<u>Fechas:</u>", styles['SectionTitle']))
    elements.append(Paragraph(
        f"<b>Fecha del evento:</b> {order.event_date.strftime('%d/%m/%Y')}",
        styles['CustomerInfo']
    ))
    elements.append(Paragraph(
        f"<b>Entrega:</b> {order.delivery_date.strftime('%d/%m/%Y')}",
        styles['CustomerInfo']
    ))
    elements.append(Paragraph(
        f"<b>Devolución:</b> {order.return_date.strftime('%d/%m/%Y')}",
        styles['CustomerInfo']
    ))
    
    # Items table
    elements.append(Paragraph("<u>Productos Alquilados:</u>", styles['SectionTitle']))
    
    # Table data
    table_data = [
        ['Producto', 'Categoría', 'Cantidad', 'Precio Unit.', 'Subtotal']
    ]
    
    for item in order.items.all():
        table_data.append([
            item.product.name,
            item.product.get_category_display(),
            str(item.quantity),
            f"${item.unit_price:.2f}",
            f"${item.subtotal:.2f}"
        ])
    
    # Create table
    table = Table(table_data, colWidths=[5*cm, 3*cm, 2*cm, 2.5*cm, 2.5*cm])
    table.setStyle(TableStyle([
        # Header style
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        
        # Body style
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (4, 1), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        
        # Borders
        ('GRID', (0, 0), (-1, -1), 0.5, colors.gray),
        
        # Alternating row colors
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
    ]))
    
    elements.append(table)
    
    # Total
    elements.append(Spacer(1, 0.5*cm))
    elements.append(Paragraph(
        f"<b>TOTAL: ${order.total:.2f}</b>",
        styles['Total']
    ))
    
    # Observations
    if order.observations:
        elements.append(Paragraph("Observaciones", styles['SectionTitle']))
        elements.append(Paragraph(order.observations, styles['Normal']))
    
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    return buffer
