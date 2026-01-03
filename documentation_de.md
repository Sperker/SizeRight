# SizeRight

**SizeRight** ist ein innovatives Werkzeug für die agile Produktentwicklung, das speziell für Product Owner, Produktmanager und Epic Owner entwickelt wurde, um die **Schätzung** und Priorisierung von großen, abstrakten **Backlog Items** wie Features und Epics zu vereinfachen.

Es löst die Herausforderung langwieriger und subjektiver „**Schätz-Meetings**“ durch einen strukturierten, visuellen Prozess, der den Anspruch verkörpert: „**Align fast. Decide with clarity.**“

Dieses Onlinehandbuch beschreibt den integrierten Prozess, den SizeRight ermöglicht, und verbindet das „Wie“ der Werkzeugnutzung mit dem „Warum“ der zugrundeliegenden strategischen Prinzipien.

---

## Das „Warum“ und „Wie“: Ein integrierter Schätz-Prozess

SizeRight ist ein geführter Prozess, der auf zwei Kernprinzipien der modernen agilen Produktentwicklung aufbaut: **Relative Schätzung** und **Wirtschaftliche Priorisierung**. Es hilft dabei, komplexe Entscheidungen in zwei klaren, aufeinanderfolgenden Schritten zu treffen.

Dieser integrierte Ansatz kombiniert die **Schätzung** des **Aufwandumfangs** (des Arbeitsumfanges/Job Size) mit der Ermittlung des **Geschäftswerts** (den Verzögerungskosten/Cost of Delay), um eine **datengesteuerte Priorisierung** mittels **Weighted Shortest Job First (WSJF)** zu ermöglichen. Die Anwendung wurde primär für die **Schätzung** von übergeordneten **Backlog Items** wie **Features** und **Epics** entwickelt, die oft abstrakt und schwer zu bewerten sind. Der strukturierte Prozess von SizeRight bietet in dieser frühen Phase Klarheit.

---

## Schritt 1: „Align fast.“ - Von vagen Ideen zum relativen Arbeitsumfang (Job Size)

### Warum nicht einfach „Stunden“ verwenden?

Die erste Herausforderung in jedem Projekt ist das Verständnis über die zu erledigende Arbeit. Traditionell versuchen Teams, in absoluten Einheiten wie „Stunden“ oder „Tagen“ zu schätzen.

Dieser Ansatz hat entscheidende Nachteile:

* **Der Trugschluss der Präzision:** Eine Schätzung von „40 Stunden“ fühlt sich präzise an, ist aber höchst subjektiv. Sie ignoriert individuelle Fähigkeiten, Meetings und unvorhergesehene Probleme und erzeugt so ein falsches Gefühl von Sicherheit.
* **Kognitive Verzerrung (Cognitive Bias):** Menschen sind von Natur aus schlecht in absoluter Schätzung („Wie viele Stunden wird das dauern?“), aber hervorragend in vergleichender Schätzung („Ist diese Aufgabe *größer* oder *kleiner* als jene Aufgabe?“).
* **Psychologischer Druck:** Eine stundenbasierte Schätzung wird oft als „Blutschwur“ oder Deadline behandelt, was zu Abstrichen bei der Qualität führt.

Das Ziel ist kein fehlerhafter, pseudo-präziser Plan, sondern ein **gemeinsames Verständnis** über die vorliegenden Arbeit.

### Der Prozess: Den Arbeitsumfang (Job Size) auftrennen

SizeRight löst dies, indem es die Diskussion von absoluten Werten wie Zeit wegleitet. Der Prozess beginnt mit der Frage: „Wie groß ist das Feature/Epic?“

Anstelle einer einzelnen Zahl leitet die Anwendung die gemeinsame Diskussion, um den **Arbeitsumfang (Job Size)** anhand von drei greifbaren, relativen Dimensionen zu bewerten:

* **Komplexität:** „Wie *schwierig* ist das?“ (z.B.: neue Technologie, komplexe Logik)
* **Aufwand:** „Wie *viel* Arbeit ist das?“ (z.B.: hohes Volumen repetitiver Aufgaben)
* **Unsicherheit:** „Was wissen wir *nicht*?“ (z.B.: unklare Anforderungen, externe Abhängigkeiten)

### Kategorisierung mit T-Shirt-Größen (Affinity Estimation)

Sobald der numerische **Arbeitsumfang (Job Size)** (z.B.:. 12) aus diesen drei Dimensionen berechnet ist, unterstützt SizeRight den letzten Schritt der Angleichung: die Kategorisierung. Es wird das Prinzipien der **Affinity Estimation** angewendet, bei der Items in „Eimer“ (Buckets) ähnlicher Größe gruppiert/zugeordnet werden.

Anstatt sich im geringfügigen Unterschied zwischen einer „12“ und einer „13“ zu verlieren, ermöglicht das Werkzeug die Zuweisung einer **T-Shirt-Größe** (z.B.: XS, S, M, L). Dieser Akt des „Bucketings“ dient mehreren Zielen:

* **Reduziert falsche Präzision:** Es erkennt an, dass die Zahl ein Richtwert ist, keine perfekte Messung.
* **Beschleunigt die Kommunikation:** Es ist schneller, über „M-große Items“ zu sprechen als über „Items zwischen 11 und 15 Punkten“.
* **Visuelle Gruppierung:** Es ermöglicht dem Team, Items ähnlicher Größenordnung visuell zu gruppieren und zu verwalten.

### Das Ergebnis: Schnelle Angleichung

Das Hauptziel dieser Schätzung ist nicht die endgültige Zahl selbst, sondern die **Konversation**, die sie erzeugt. Wenn eine Person die **Komplexität** als 5 und eine andere als 2 einschätzt, deckt die resultierende Diskussion verborgene Annahmen auf und bringt das Team auf einen einheitlichen Stand.

Das ist die „Align fast“-Philosophie. Die Visualisierung als „Bubble-Chart“ (Blasendiagramm) im Werkzeug zeigt sofort, *warum* etwas wie groß ist (z.B.: hohe **Komplexität**, aber geringer **Aufwand**), und die **T-Shirt-Größe** liefert eine einfache Kategorie dafür, was eine objektive Basis für eine schnelle, gemeinsame Entscheidung schafft.

---

## Schritt 2: „Decide with clarity.“ - Vom Arbeitsumfang (Job Size) zur wirtschaftlichen Priorität

### Ein wirtschaftlicher Standpunkt

Sobald der **Arbeitsumfang (Job Size)** als stabile Basis etabliert ist, verschiebt sich der Fokus von der Größe zum **Geschäftswert (Business Value)**. Die zentrale geschäftliche Frage, die sich stellt, ist, wie hoch die Kosten für das Unternehmen sind, die es für jede Woche oder jeden Monat zahlt, in denen die Auslieferung dieses Features *verzögert* wird.

Dieses Konzept sind die **Verzögerungskosten (Cost of Delay kurz CoD)**.

### Der Prozess: Die Verzögerungskosten (Cost of Delay) auftrennen

Der „Cost of Delay“-Tab (Registerkarte) in SizeRight beantwortet diese Frage, indem er die Diskussion durch drei etablierte Skalen führt, wie sie z.B.: im SAFe Framework definiert sind:

* **(BV) Anwender- und Geschäftswert (User-/Business Value):** Welchen Nutzen stiftet es? (z.B.: Umsatz, Marktdifferenzierung)
* **(TC) Zeitkritikalität (Time Criticality):** Wie wichtig ist der Zeitfaktor? (z.B.: eine feste Deadline, ein Marktfenster)
* **(RR/OE) Risikoreduzierung und/oder Chanceneröffnung (Risk Reduction/Opportunity Enablement):** Reduziert es ein Risiko oder ermöglicht es eine zukünftige Chance?

Gerade die **RR/OE-Komponente** ist strategisch entscheidend. Sie gibt wichtiger Infrastrukturarbeit, Sicherheitsfixes oder Enablern der Architektur eine Stimme. Ohne diese wäre der Fokus möglicherweise nur auf kurzfristige, sichtbare Features. RR/OE stellt sicher, dass kritische „Enabler“-Aufgaben auf gleicher wirtschaftlicher Augenhöhe mit neuen Features konkurrieren können, und balanciert so kurzfristige Lieferung mit langfristiger Produktgesundheit aus.

### Das Ergebnis: Datengesteuerte Priorisierung mit WSJF

Sobald diese Werte im Dialog ermittelt wurden, berechnet SizeRight automatisch den **Weighted Shortest Job First (WSJF)**-Wert. Diese Formel bietet einen einfachen, rationalen Algorithmus zur Optimierung des Werteflusses.

Die ursprüngliche Formel lautet:
Visualisierung WSJF= Cost of Delay / Duration

Die SizeRight-Formel lautet:
Visualisierung WSJF= Verzögerungskosten (Cost of Delay) / Arbeitsumfang (Job Size)

Das Ziel ist es, die „Quick Wins“ zu identifizieren - jene Items, die den **höchsten Wert (CoD) für den geringsten Aufwand (Arbeitsumfang/Job Size)** liefern.

Diese Formel führt oft zu kontraintuitiven, aber wirtschaftlich optimalen Entscheidungen. Ein massives Feature mit hohen **Verzögerungskosten (CoD)** wird möglicherweise zugunsten eines kleineren Features mit mittlerem **Verzögerungskosten (CoD)** depriorisiert, weil das kleinere Item seinen Wert *schneller* liefert. Diese „Macht des Nenners“ (Power of the denominator) liefert eine klare, wirtschaftlich fundierte Empfehlung für die Priorisierung.

Entscheidungen müssen nicht länger auf Basis von Bauchgefühl oder der „lautesten Stimme“ getroffen werden. Prioritäten werden objektiv begründet, sodass Sie „**Decide with clarity**“ (mit Klarheit entscheiden) können.

---

## Analyse aus verschiedenen Perspektiven

Ein wesentlicher Teil der Entscheidungsfindung ist die Betrachtung der Ergebnisse aus verschiedenen Perspektiven. Um dies zu unterstützen, bietet SizeRight **vier** unterschiedliche Ansichten zur Analyse, die über Tabs im Visualisierungsbereich zugänglich sind: eine **Arbeitsumfang (Job Size) Visualisierung** (Bubble-Chart), eine **Verzögerungskosten (Cost of Delay) Visualisierung** (Bubble-Chart), eine **WSJF Visualisierung** (Cost of Delay Chart) und eine **Tabelle für relative Schätzung**-Ansicht. Diese Tabellenansicht ermöglicht den direkten Vergleich und das Sortieren aller Metriken nebeneinander und vereinfacht die **relative Schätzung**.

Benutzer können dynamisch zwischen diesen Ansichten wechseln und das gesamte Backlog nach verschiedenen Metriken sortieren:

* **Sortierung nach „Arbeitsumfang (Job Size)“:** Welche Features/Epics sind die größten Brocken?
* **Sortierung nach „T-Shirt-Größe“:** Wie verteilen sich die von uns vergebenen Größen?
* **Sortierung nach „Verzögerungskosten (Cost of Delay)“:** Welche Items haben den höchsten **Geschäftswert (Business Value)** oder die größte Dringlichkeit?
* **Sortierung nach WSJF:** Was ist die wirtschaftlich sinnvollste Reihenfolge für die Implementierung?

Dieser dynamische Perspektivenwechsel ermöglicht eine tiefere Analyse und hilft, Priorisierungsentscheidungen zu validieren und zu kommunizieren. Der gesamte Arbeitsablauf - von der ersten Diskussion über die Größe bis hin zur finalen, aus verschiedenen Blickwinkeln analysierten und priorisierten Liste - findet nahtlos in einer Anwendung statt. Dieser integrierte Prozess führt strukturiert von einer schnellen Einigung zu einer klaren Entscheidung - **Align fast. Decide with clarity**.

---

# Positionierung

## Was SizeRight ist

SizeRight ist ein zweckgebundenes **Moderations- und Visualisierswerkzeug**, das dafür entwickelt wurde, während **interaktiver Planungssessions** auf einem „großen Bildschirm“ (Monitor oder Beamer im Besprechungsraum) angezeigt zu werden. Die primäre Mission ist es, das Team dabei zu unterstützen: „**Align fast. Decide with clarity.**“, indem abstrakte Diskussionen in greifbare, **datengestützte** Metriken verwandelt werden. Es dient als temporärer Arbeitsbereich, um die Brücke zwischen noch vagen/abstrakten Ideen und konkreter **wirtschaftlicher Priorisierung** mittels **WSJF** (Weighted Shortest Job First) zu schlagen.

## Was SizeRight nicht ist

SizeRight ist **keine Enterprise-Lösung** und kein „System of Record“ (wie Jira oder Azure DevOps). Es ist explizit **nicht** als langfristiges **Dokumentationsarchiv** oder als Datenbank für das Verwalten des Lebenszyklus von **Backlog Items** konzipiert. Es ersetzt nicht Ihr ALM-Tool (Application Lifecycle Management), sondern fungiert als taktischer Vorprozessor dafür.

Ebenso ist SizeRight **kein Controlling-Instrument**. Es verwendet **relative Proxys** für die **Weighted Shortest Job First (WSJF)** berechnung (Stellvertreter-Metriken: **Arbeitsumfang (Job Size)**, bestehend aus *Komplexität*, *Aufwand* und *Unsicherheit*, als Proxymetrik **für Dauer**. Die **Verzögerungskosten (Cost of Delay)**, bestehend aus *(BV) Anwender- und Geschäftswert (User-/Business Value)*, *(TC) Zeitkritikalität (Time Criticality)* und *(RR/OE) Risikoreduzierung und/oder Chanceneröffnung (Risk Reduction/Opportunity Enablement)*), um das eigentlich „Unschätzbare“ quantifizierbar und vergleichbar zu machen. Diese Werte dienen der taktischen Ausrichtung und Priorisierung; sie sind **nicht** für buchhalterische Zwecke, Leistungsbeurteilungen, Budgetierung oder exaktes Reporting geeignet.

---

# Benutzerhandbuch: **SizeRight**

Dies ist das Benutzerhandbuch für SizeRight, ein Werkzeug zur Vereinfachung **agiler Schätzungen** und **datengesteuerter Priorisierung**. Dieses Handbuch beschreibt alle Funktionen, die zur Nutzung der Anwendung erforderlich sind.

**Systemanforderung:** SizeRight ist für die Nutzung am Desktop konzipiert. Falls die Bildschirmauflösung unter dem empfohlenen Minimum liegt (z. B. auf Mobilgeräten oder bei sehr kleinen Fenstern), erscheint ein Warnhinweis, um sicherzustellen, dass genügend Platz für die Visualisierungen vorhanden ist. Das Browserfenster sollte maximiert oder ein größerer Bildschirm verwendet werden.

## 1. Kernkonzepte

Bevor Sie die Anwendung verwenden, ist es wichtig, die **zugrundeliegenden Schätz-Konzepte** sowie die **drei Schlüsselmetriken** zu verstehen.

### Absolute vs. Relative Schätzung

* **Absolute Schätzung:** Dieser Ansatz versucht, einen präzisen, absoluten Wert für ein Item zu bestimmen (z. B. „Diese Aufgabe dauert 20 Stunden“ oder „Das sind 8 Story Points“). Diese Art der Schätzung ist oft schwierig, zeitaufwändig und subjektiv, insbesondere bei großen, abstrakten Backlog Items wie Features oder Epics.
* **Relative Schätzung:** Bei diesem Ansatz werden Items nicht isoliert bewertet, sondern miteinander verglichen. Die zentrale Frage ist: „Ist Feature A größer oder kleiner als Feature B?“ oder „Wie viel größer ist A im Vergleich zu B?“. Diese Methode ist für Menschen intuitiver, schneller und führt zu einem besseren gemeinsamen Verständnis (Abgleich) im Team.

**SizeRight basiert grundlegend auf dem Prinzip der relativen Schätzung.** Anstatt eine absolute Zahl zu raten, leitet die Applikation das Team an, Items anhand greifbarer Dimensionen (wie **Komplexität**, **Aufwand** und **Unsicherheit**) zu diskutieren und sie visuell zueinander in Beziehung zu setzen (siehe Abschnitt 8.4, „Tabelle für relative Schätzung“).

### Die drei Schlüsselmetriken

SizeRight verwendet drei Schlüsselmetriken, um diesen Prozess zu strukturieren:

* **Arbeitsumfang (Job Size):** Diese ist keine direkte Schätzung, sondern die Summe von drei Dimensionen:
    * **Komplexität:** Wie schwierig ist die Umsetzung?
    * **Aufwand:** Wie viel Arbeit ist erforderlich?
    * **Unsicherheit:** Wie viele Unbekannte gibt es?
* **Verzögerungskosten (Cost of Delay):** Diese Metrik quantifiziert den Geschäftswert (Business Value) und die Dringlichkeit. Sie ist die Summe aus:
    * **(BV) Anwender- und Geschäftswert (User-/Business Value):** Der Nutzen für Kunden oder das Unternehmen.
    * **(TC) Zeitkritikalität (Time Criticality):** Verliert das Item an Wert, wenn es verzögert/aufgeschoben wird?
    * **(RR/OE) Risikoreduzierung und/oder Chanceneröffnung (Risk Reduction/Opportunity Enablement):** Reduziert es Risiken oder eröffnet es neue Möglichkeiten?
* **Weighted Shortest Job First (WSJF):** Der finale Priorisierungswert, der automatisch berechnet wird: `Visualisierung WSJF= Verzögerungskosten (Cost of Delay) / Arbeitsumfang (Job Size)`.

## 2. Erste Schritte: Ein Backlog Item erstellen

1.  Ein Klick auf die Schaltfläche **Backlog Item hinzufügen** startet den Prozess.
2.  Die Dialogbox **Neues BI erstellen** öffnet sich. Geben Sie im oberen Eingabefeld einen aussagekräftigen **Titel** für das Feature/Epic ein.
3.  Fahren Sie anschließend mit der **Schätzung** fort.

**Laden von Demo-Daten:** Wenn Sie SizeRight neu verwenden und die Liste leer ist, wird in der Hauptansicht die Option **"Demo-Daten laden"** angezeigt. Durch Klicken auf diesen Link (z.B. für EN oder DE) wird die Anwendung mit Beispiel-Items gefüllt, sodass die Funktionen und Visualisierungen sofort erkundet werden können.

## 3. Der Schätz-Prozess im Detail

Der Schätz-Prozess ist in zwei Phasen unterteilt. Die erste, grundlegende Phase ist die Bestimmung des **Arbeitsumfangs (Job Size)**. Dieser bildet die Diskussionsgrundlage und die anschließende Zuweisung einer **T-Shirt-Größe**. Die zweite Phase, die Bestimmung der **Verzögerungskosten (Cost of Delay)**, ist *optional*. Sie wird nur benötigt, wenn der **WSJF-Wert** für die wirtschaftliche Priorisierung berechnet werden soll, und ist für die Zuweisung von T-Shirt-Größen nicht notwendig.

**Dialogstruktur**

Der Dialog **BI bearbeiten** hat ein erweitertes Layout. Der **Titel** erstreckt sich über die gesamte Breite. Darunter ist der Dialog zweispaltig aufgebaut: Links befinden sich die Skalen für die **Schätzung**, rechts ein **Rich-Text-Editor** für Notizen und Annahmen.

**Schritt A: Den Arbeitsumfang (Job Size) bestimmen**

1.  Der Tab **Arbeitsumfang** muss aktiv sein.
2.  Die drei Schieberegler werden bewegt, um eine gemeinsame Einschätzung für **Komplexität**, **Aufwand** und **Unsicherheit** festzulegen.
    * **Klickbare Skala:** Anstatt den Regler zu ziehen, kann auch **direkt auf die Zahlen** unterhalb der Linie geklickt werden, um den Wert zu setzen. Die aktuell gewählte Zahl wird durch einen **schwarzen Kreis** hervorgehoben.

*Triangulation (Referenzmarker):*

Zur Unterstützung einer besseren relativen Schätzung nutzt SizeRight **Triangulation**. Wenn Referenz-Items (Minimum/Maximum, siehe Abschnitt 6) definiert wurden, erscheinen deren Werte als farbige **Marker direkt auf den Skalen** der Schieberegler. Dies ermöglicht einen sofortigen Vergleich des aktuellen Items mit der Basislinie (z.B. „Ist diese Komplexität höher als unser Referenz-Maximum?“).
* Marker erscheinen nur, wenn aktiv ein **Minimum** (Orange) oder **Maximum** (Blau) Referenz-Item gesetzt wurde.
* Diese Marker können über die Schaltfläche **„Marker anzeigen/ausblenden“** unterhalb der Regler ein- oder ausgeblendet werden.
* Diese Einstellung wird global in den Einstellungen gespeichert und beim Export berücksichtigt.

*Wichtige Hinweise zur **Arbeitsumfang/Job Size-Schätzung**:*

* **Speichern:** Um ein neues **Backlog Item** zu speichern, ist **nur der Titel erforderlich**. Zunächst kann eine Liste mit den Items erstellt werden, deren Schätzung dann zu einem späteren Zeitpunkt erfolgt. Ein **Arbeitsumfang (Job Size)-Wert** (und eine **T-Shirt-Größe**) wird jedoch erst berechnet, wenn alle drei Werte (Komplexität, Aufwand, Unsicherheit) jeweils auf einen Wert größer als 0 gesetzt sind.
* **Mindestwert:** Sobald ein Regler von 0 wegbewegt wurde, ist der **niedrigstmögliche Wert pro Skala 1**.
* **Zurücksetzen:** Mit der Schaltfläche **Arbeitsumfang zurücksetzen** können Sie alle drei **Regler des Arbeitsumfang (Job Size)** auf null zurücksetzen.
* **Skala:** Standardmäßig verwendet das Tool die **SAFe Fibonacci-Skala** (1, 2, 3, 5, 8). Dies kann in den Einstellungen geändert werden (siehe Abschnitt 11).

**Schritt B: Die „Verzögerungskosten (Cost of Delay)“ für die WSJF-Priorisierung bestimmen**

1.  Ein Klick auf den Tab **Verzögerungskosten** wechselt die Ansicht.
2.  Die drei Schieberegler werden bewegt, um die gemeinsame Einschätzung für **(BV) Anwender- und Geschäftswert**, **(TC) Zeitkritikalität** und **(RR/OE) Risikoreduzierung und/oder Chanceneröffnung** festzulegen.
3.  Sobald alle drei **Werte der Verzögerungskosten (Cost of Delay)** und jene des **Arbeitsumfangs (Job Size)** festgelegt wurden, erscheint der berechnete **WSJF**-Wert automatisch oben rechts oben im Dialogfeld.
4.  *Hinweis:* Referenzmarker (Triangulation) sind auch auf diesen Skalen verfügbar, sofern entsprechende Referenz-Items gesetzt sind.

*Wichtiger Hinweis:*

* **Der WSJF-Wert** kann nicht ohne eine abgeschlossene "Arbeitsumfang/Job Size"- und "Verzögerungskosten/Cost of Delay-Schätzung" berechnet werden.
* **Zurücksetzen:** Mit der Schaltfläche **Verzögerungskosten zurücksetzen** können Sie alle drei Regler der **Verzögerungskosten (Cost of Delay)** auf null zurücksetzen.

**Zusätzliche Informationen eingeben**

In der rechten Spalte des Dialogfelds befindet sich ein **Rich-Text-Editor**. Hier können kontextbezogene Informationen wie **Annahmen, Risiken oder offene Fragen** dokumentiert werden.

* **Formatierung:** Text kann formatiert werden (fett, kursiv, unterstrichen, durchgestrichen) und **Hyperlinks** können eingefügt werden.
* **Farben:** Eine von **vier voreingestellten Hervorhebungsfarben** (z.B. für Warnungen oder wichtige Infos) kann auf Text angewendet werden. Diese spezifischen Farben können in den globalen **Einstellungen** angepasst werden und werden mit den Projektdaten gespeichert.
* **Bereinigung beim Einfügen:** Beim Einfügen von Inhalten aus externen Quellen (Word, Webseiten) bereinigt der Editor den Text automatisch, entfernt nicht unterstützte Stile und behält dabei die grundlegende Struktur bei.

**Die Schätzung abschließen und Navigation**

* Mit einem Klick auf **Speichern** wird das **Backlog Item** erstellt oder aktualisiert. Die Schaltfläche ist aktiv, sobald ein **Titel** eingegeben wurde.
* **Schnelle Navigation:** Über die Pfeiltasten im Kopfbereich des Dialogs kann direkt zum **vorherigen** oder **nächsten** Item im Backlog gewechselt werden.
    * **Auto-Save:** Wenn Änderungen am aktuellen Item vorgenommen wurden, ändert sich die Beschriftung der Schaltfläche zu **„Speichern & Nächstes“** (bzw. „Speichern & Vorheriges“). Ein Klick darauf speichert die Änderungen automatisch und lädt sofort das nächste Item, was einen sehr schnellen Arbeitsfluss ohne Schließen des Dialogs ermöglicht.
* Mit einem Klick auf **Abbrechen** schließt sich der Dialog ohne zu speichern.

## 4. Übersicht der Benutzeroberfläche

Die Hauptansicht von SizeRight ist in zwei Hauptbereiche (Ansichten) unterteilt:

* Die **„Backlog Item Liste“** (linker Bereich), wo Items erstellt und verwaltet werden.
* Der **„Visualisierungsbereich“** (rechter Bereich), der in **vier** Tabs für unterschiedliche Analyseperspektiven organisiert ist:
    1.  **Visualisierung Arbeitsumfang:** Eine Bubble-Chart-Ansicht mit Fokus auf "Arbeitsumfang/Job Size" (Komplexität, Aufwand, Unsicherheit).
    2.  **Visualisierung Verzögerungskosten:** Eine Bubble-Chart-Ansicht mit Fokus auf "Verzögerungskosten/Cost of Delay" (BV, TC, RR/OE).
    3.  **Visualisierung WSJF:** Eine Chart-Ansicht, die die wirtschaftlichen Auswirkungen (Cost of Delay) über die Zeit für verschiedene Sequenzen visualisiert.
    4.  **Tabelle für relative Schätzung:** Eine leistungsstarke Tabellenansicht, die alle Items und ihre Metriken in einer sortierbaren, vergleichbaren Tabelle anzeigt.

Die Größe dieser beiden Bereiche kann durch Verschieben der **Trennlinie** in der Mitte mit der Maus angepasst werden, um die jeweils wichtigere Ansicht zu fokussieren.

## 5. Backlog Items verwalten

**Backlog Items** können auf zwei Wegen bearbeitet werden:

* Über die **Backlog Item Liste**: Ein Klick auf die Schaltfläche **Bearbeiten** bei einem Item öffnet den "BI bearbeiten"-Dialog.
* Über den **Visualisierungsbereich**: Wenn mit dem Mauszeiger über eine Visualisierungs-Karte (**„Visualisierung Arbeitsumfang“** oder **„Visualisierung Verzögerungskosten“**) gefahren wird, erscheint oben rechts ein Bearbeiten-Symbol. Ein Klick darauf öffnet ebenfalls den "BI bearbeiten"-Dialog.

Um ein Item zu entfernen, nutzen Sie die Schaltfläche **Löschen** in der **Backlog Item Liste**. Es erscheint zunächst eine Bestätigungsmeldung.

## 6. Ein Referenz-Item festlegen

Ein Kernstück der **relativen Schätzung** ist der Vergleich neuer Items mit einer bekannten Referenz. SizeRight ermöglicht es, jedes Backlog Item als **Referenz-Item** festzulegen. Dieses System unterstützt zwei Arten von Referenzen, um die Schätzskala einzurahmen:

1.  **Minimum Referenz (-):** Repräsentiert ein kleines oder einfaches Item (die Basislinie für "Niedrig").
2.  **Maximum Referenz (+):** Repräsentiert ein großes oder komplexes Item (die Basislinie für "Hoch").

**So wird eine Referenz festgelegt:**

* In der **Backlog Item Liste** (linker Bereich) verfügt jedes Item über zwei kleine Symbole:
    * Ein Klick auf das **Orange Minus (-)** Symbol setzt das Item als **Minimum Referenz**.
    * Ein Klick auf das **Blaue Plus (+)** Symbol setzt das Item als **Maximum Referenz**.
* Es kann gewählt werden, nur ein Minimum, nur ein Maximum, beides oder keines zu setzen.

**Auswirkung des Setzens einer Referenz:**

1.  **Hervorhebung:** Referenz-Items werden in der Liste hervorgehoben und **an den Anfang aller Standard-Anzeigeansichten gepinnt** ("Visualisierung Arbeitsumfang", "Visualisierung Verzögerungskosten" und "Tabelle für relative Schätzung").
2.  **Triangulation:** Das Setzen einer Referenz aktiviert die entsprechenden Marker auf den Schätzskalen im "BI bearbeiten"-Dialog (siehe Abschnitt 3).

**Entfernen einer Referenz:**
Durch erneutes Klicken auf das hervorgehobene Minus (-) oder Plus (+) Symbol wird die Referenz aufgehoben.

*Wichtiger Hinweis zum Verhalten von Referenz-Items:*

* **Standard-Ansichten:** In den Ansichten "Visualisierung Arbeitsumfang", "Visualisierung Verzögerungskosten" und "Tabelle für relative Schätzung" wird das Referenz-Item physisch an den Anfang verschoben.
* **Ansicht „Visualisierung WSJF“:** In dieser Ansicht wird das Referenz-Item **nicht** an den Anfang gepinnt, da die in den Diagrammen gezeigte Reihenfolge entscheidend ist.
* **Modus „Benutzerdefinierte Sortierung“:** Wird die „Benutzerdefinierte Sortierung“ verwendet (siehe Abschnitt 9), bleibt das Referenz-Item an seiner definierten Position in der Liste. Es wird jedoch ein **nicht-interaktiver Klon** des Referenz-Items an der obersten Stelle zu Vergleichszwecken angezeigt.

Während ein Item als Referenz gepinnt ist, können seine Werte nicht direkt in der Tabelle der "Tabelle für relative Schätzung"-Ansicht bearbeitet werden. Dies verhindert versehentliche Änderungen an der Referenz. Zur Bearbeitung des Referenz-Items wird die Schaltfläche **Bearbeiten** (entweder in der Liste oder der Visualisierung) verwendet, um den "BI Bearbeiten"-Dialog zu öffnen.

## 7. T-Shirt-Größen zuweisen

Sobald der **Arbeitsumfang (Job Size)** berechnet wurde, kann eine relative **T-Shirt-Größe** zugewiesen werden.

1.  Dies geschieht durch einen Klick entweder auf die **grauen Schaltfläche mit dem „-“ darin** (z. B. „[ M ]“) in der **Backlog Item Liste** oder direkt auf das entsprechende **T-Shirt-Größe-Label** auf der **Visualisierungs-Karte** im Tab **Visualisierung Arbeitsumfang**.
2.  Es erscheint ein Pop-up-Menü, in dem die passende Größe (z. B. S, M, L, XL) ausgewählt werden kann. Die Auswahl wird sofort gespeichert.

Diese Zuweisung ist nicht endgültig. Die **T-Shirt-Größe** kann jederzeit auf dieselbe Weise wieder geändert werden, falls sich die Einschätzung im Laufe der Zeit anpasst.

## 8. Nutzung der Visualisierungs-Ansichten

Der **Visualisierungsbereich** bietet vier Tabs, um das Backlog zu analysieren.

### 8.1 Visualisierung Arbeitsumfang

Dieser Tab (die Standardansicht) zeigt eine **grafische Darstellung jedes Backlog Items** in Kartenform.

Die Karten enthalten:

* Ein **Blasendiagramm**, dessen äußerer Kreis den **Arbeitsumfang (Job Size)** darstellt und dessen innere Kreise die Anteile von **Komplexität**, **Aufwand** und **Unsicherheit** repräsentieren.
* Ein **T-Shirt-Größe**-Label zur schnellen Einordnung (klickbar, wenn der Arbeitsumfang komplett ist).
* Einen **WSJF-Wert-Indikator**, der neben der **T-Shirt-Größe** angezeigt wird, sofern ein WSJF-Wert berechnet wurde.
* Ein **Bearbeiten-Symbol**, welches erscheint, wenn die Maus in die obere rechte Kartenecke bewegt wird.

Dies ermöglicht den visuellen Vergleich, *warum* ein Item wertvoll ist, getrennt von seiner Größe.

### 8.2 Visualisierung Verzögerungskosten

Dieser Tab zeigt eine grafische Darstellung jedes **Backlog Items**. Die Karten enthalten:

* Ein **Blasendiagramm**, dessen äußerer Kreis die **Verzögerungskosten (Cost of Delay)** darstellt und dessen inneren Kreise die Anteile von **(BV) Anwender- und Geschäftswert (User-/Business Value)**, **(TC) Zeitkritikalität (Time Criticality)** und **(RR/OE) Risikoreduzierung und/oder Chanceneröffnung (Risk Reduction/Opportunity Enablement)** repräsentieren.
* Einen **WSJF-Wert-Indikator**, sofern ein WSJF-Wert berechnet wurde.
* Ein **Bearbeiten-Symbol**, welches erscheint, wenn die Maus in die obere rechte Kartenecke bewegt wird.

Dies ermöglicht den visuellen Vergleich, *warum* ein Item wertvoll ist, getrennt von seiner Größe.

### 8.3 Visualisierung WSJF

Dieser neue Tab bietet eine leistungsstarke Möglichkeit, die wirtschaftlichen Auswirkungen verschiedener Implementierungsreihenfolgen mithilfe von **Cost of Delay-Diagrammen** zu visualisieren. Er zeigt zwei Diagramme nebeneinander an:

* **Optimale Reihenfolge (nach WSJF):** Dieses Diagramm zeigt die Sequenz, die die gesamten akkumulierten Verzögerungskosten (Cost of Delay) minimiert, basierend rein auf den berechneten WSJF-Werten (höchster WSJFzuerst). Dies stellt die wirtschaftlich ideale Reihenfolge dar.
    * Sie können dieses obere Diagramm durch Klicken auf die Titelleiste **einklappen oder ausklappen**, um sich auf den Vergleich der aktuellen Reihenfolge zu konzentrieren.
* **Aktuelle Reihenfolge/Sortierung:** Dieses Diagramm zeigt die Sequenz basierend auf der **aktuell ausgewählten Sortierreihenfolge** in der Filterleiste (z. B. sortiert nach Arbeitsumfang, CoD, T-Shirt-Größe oder benutzerdefinierter Reihenfolge).

**Die Diagramme verstehen:**

* **X-Achse:** Repräsentiert den **Kumulierten Arbeitsumfang (Job Size)**, während Items nacheinander abgeschlossen werden.
* **Y-Achse:** Repräsentiert die **Verzögerungskosten (Cost of Delay)** (Wert pro Zeiteinheit, z. B. pro Woche). Die Höhe der Balken zeigt den CoD einzelner Items an.
* **Farbige Blöcke:** Repräsentieren ein Item, das **bearbeitet** wird. Die Zahl darin ist der **WSJF-Rang** des Items (1 ist der höchste WSJF). Sie können auf die Rangnummer in der Backlog Item Liste klicken (wenn dieser Tab aktiv ist), um die Farbe für visuelle Gruppierungen zu ändern.
* **Graue Blöcke:** Repräsentieren Items, die **warten**, während ein anderes Item bearbeitet wird. Die Zahl darin zeigt die **Akkumulierten Verzögerungskosten**, die *diesem spezifischen Item* bis zu diesem Zeitpunkt entstanden sind.
* **Gesamte Verzögerungskosten:** Diese Zahl wird über jedem Diagramm angezeigt und stellt die Summe aller akkumulierten Verzögerungskosten für *alle* Items in dieser spezifischen Sequenz dar. Der Vergleich der Gesamtkosten der „Aktuellen Reihenfolge“ mit der „Optimalen Reihenfolge“ zeigt die wirtschaftlichen Auswirkungen einer Abweichung von der reinen WSJF-Sequenz.

Diese Ansicht hilft bei der Beantwortung von Fragen wie: „Wie viel kostet es uns *wirtschaftlich*, wenn wir Items in unserer aktuell bevorzugten Reihenfolge implementieren, verglichen mit der mathematisch optimalen WSJF-Reihenfolge?“

**Anzeige des WSJF-Rangs:** Wenn dieser Tab aktiv ist, wird der berechnete **WSJF-Rang** (basierend auf der optimalen Reihenfolge) auch als farbiges Tag neben der T-Shirt-Größe in der **Backlog Item Liste** angezeigt. Ein Klick auf dieses Tag wechselt durch verschiedene Hintergrundfarben, was es Ihnen ermöglicht, Items basierend auf ihrem WSJF-Rang anwendungsweit visuell zu gruppieren oder hervorzuheben. Diese benutzerdefinierten Farben werden beim Export gespeichert.

### 8.4 Tabelle für relative Schätzung

Die zentrale Ansicht für die **relative Schätzung**. Sie bietet eine tabellarische Übersicht über alle Items und ihre Metriken.

* **Spalten:** Zeigt alle Metriken nebeneinander (**Complexity**, **Effort**, **Uncertainty**, **Job Size**, **BV**, **TC**, **RR/OE**, **CoD** und **WSJF**).
* **Sortierung:** Durch Klicken auf die **Spaltenüberschrift** einer Metrik wird die gesamte Liste danach sortiert (es sei denn, „Benutzerdefinierte Sortierung“ oder „Sortierung sperren“ ist aktiv). Indikatoren in der Kopfzeile zeigen die aktive Sortierspalte und -richtung an.
* **Spaltenhervorhebung:** Ein Klick auf das **Augen-Symbol** in einer Überschrift hebt die Spalte dieser spezifischen Metrik hervor, was das Durchgehen von oben nach unten erleichtert.
* **Direkte Bearbeitung:** Nicht berechnete Zellen (wie "Komplexität", "Aufwand" etc.) können durch Anklicken schnell über ein Pop-up geändert werden, ohne den "BI Bearbeiten"-Dialog öffnen zu müssen.
* **Berechnete Werte:** **Job Size**, **CoD** und **WSJF** werden automatisch berechnet und angezeigt. Wenn Daten fehlen, zeigt die Zelle 'nv' (nicht verfügbar) und ein Tooltip zeigt, welche Werte noch benötigt werden.

## 9. Ansicht filtern und sortieren

Über der **Backlog Item Liste** befinden sich Filter zur Anpassung der Ansicht.

* **Sortierkriterium ändern:** Ein Klick auf die Schaltflächen **Arbeitsumfang**, **T-Shirt-Größe**, **Verzögerungskosten** oder **WSJF** ändert das Sortierkriterium.
* **Sortierrichtung ändern:** Die Pfeil-Schaltflächen (aufsteigend und absteigend) kehren die Reihenfolge um.
* **Benutzerdefinierte Sortierreihenfolge:** Ein Klick auf die Schaltfläche **„Benutzerdefinierte Sortierung“** (Person-Symbol) aktiviert den Drag & Drop-Modus für die **Backlog Item Liste**. Sie können die Items nun manuell in jede gewünschte Reihenfolge ziehen. Diese benutzerdefinierte Reihenfolge wird dann in allen Ansichten widergespiegelt.
* **Auswirkung:** Die gewählte Sortierung, Richtung **oder benutzerdefinierte Reihenfolge** wird **global auf alle drei Anzeige-Ansichten angewendet** ("Visualisierung Arbeitsumfang", "Visualisierung Verzögerungskosten", "Visualisierung WSJF" und "Tabelle für relative Schätzung").
* **Sortierung & Filter zurücksetzen:** Ein Klick auf die Schaltfläche **Filter & Sortierung zurücksetzen** (das runde „x“-Symbol) entfernt alle aktiven Sortierungen und Filter, **ausgenommen einer etwaigen benutzerdefinierten Reihenfolge**. Das Backlog kehrt in seine **ursprüngliche Erstellungsreihenfolge** zurück.
* **Sortierreihenfolge sperren:** Sobald eine Sortierreihenfolge (Standard oder benutzerdefiniert) zur Diskussion gefunden wurde, kann auf das **Schloss-Symbol** geklickt werden. Dies friert die aktuelle Reihenfolge der Items ein und verhindert versehentliche Änderungen während der Analyse oder Bearbeitung **via Sortier-Buttons oder Drag & Drop**. Ein erneuter Klick auf das Schloss hebt die Sperre auf.

Die aktuell aktive Sortierung wird zur Orientierung im **Visualisierungsbereichs** neben der Legende angezeigt (z.B.: „Sortiert nach: **WSJF** - Absteigend“ oder „Sortiert nach: **Benutzerdefinierte Sortierreihenfolge**“).

**Sortieren aus der Tabelle:** Auch in der **Tabelle für relative Schätzung**-Ansicht wird durch Klicken auf die Spaltenüberschrift einer Metrik sortiert (es sei denn, die benutzerdefinierte Sortierung oder die Sperrung ist aktiv).

**Das "Ausgrauen" irrelevante Items:** Wenn Werte für ein Sortierkriterium fehlen (z.B.: Sortierung nach **WSJF**, aber die **Verzögerungskosten (Cost of Delay)** wurden für ein Item nicht geschätzt), **werden diese Backlog Items in allen Ansichten ausgegraut**. Das bedeutet, sie werden von der aktuellen Sortierung ausgenommen, bleiben aber für den Kontext sichtbar. Dieser visuelle Hinweis ist entscheidend: Es wird angezeigt, welche Items aufgrund fehlender Daten von der aktuellen Sortierung ausgeschlossen sind. **Referenz-Items** sind generell davon ausgenommen, basierend auf der Sortierungsrelevanz ausgegraut zu werden.

## 10. Daten importieren und exportieren

SizeRight bietet Optionen zum Speichern der Arbeit oder zum Exportieren von Daten für die externe Verwendung.

* **JSON Export (Backup):** Ein Klick auf das **Export**-Symbol (Diskette) speichert den gesamten Arbeitsstand in einer `.json`-Datei. Diese Datei enthält **alle Backlog Items** sowie **alle aktuellen Anwendungseinstellungen** (wie **Sprache**, gewählten **Skalentyp**, **T-Shirt-Größen**-Definitionen, **Farbeinstellungen**, definierte **Editor-Farben**, **Triangulations/Marker-Einstellungen**, die aktuellen **Sortierkriterien und -richtung**, eine definierte **benutzerdefinierte Sortierreihenfolge** und benutzerdefinierte **Farben der WSJF-Ränge**).
* **CSV Export (Tabelle):** Ein Klick auf die Schaltfläche **CSV** öffnet einen Dialog zum Exportieren des Backlogs als `.csv`-Datei. Dieses Format ist ideal für das Öffnen von Daten in Excel, Numbers oder Google Sheets.
    * **CSV Optionen:** Vor dem Export kann die **Sortierung** für die Exportdatei gewählt werden (z.B. sortiert nach WSJF oder Arbeitsumfang).
    * **Dateninhalt:** Die CSV enthält alle Metriken, berechneten Werte und die **Notizen & Annahmen**. Textformatierungen aus dem Rich-Text-Editor (wie fett oder Listen) werden automatisch in das **Markdown**-Format konvertiert, um die Lesbarkeit in Textzellen zu verbessern.
* **Import:** Ein Klick auf das Import-Symbol (geöffneter Ordner) ermöglicht das Laden einer zuvor exportierten `.json`-Datei. Beim Import werden **sowohl das Backlog als auch alle gespeicherten Einstellungen wiederhergestellt**, sodass der komplette Arbeitsbereich mit anderen geteilt oder gesichert werden kann.

## 11. Einstellungen anpassen

Über das Regler-Symbol sind die Einstellungen erreichbar. Hier kann das Werkzeug an die jeweiligen Bedürfnisse angepasst werden:

* **Sprache:** Es kann zwischen Deutsch und Englisch gewählt werden.
* **Skala:** Hier wird die globale Skala für alle Schieberegler festgelegt. Es kann zwischen **Arithmetisch (1-8)** und **SAFe Fibonacci (1, 2, 3, 5, 8)** gewählt werden.
* **Referenzmarker:** Durch Aktivieren von "Referenzmarker auf Skalen anzeigen" wird die **Triangulations**-Funktion global eingeschaltet. Diese Einstellung wird gespeichert und exportiert.
* **T-Shirt-Größen**: Unterschiedliche **T-Shirt-Größen** können aktiviert oder deaktiviert werden.
* **Farbeinstellungen:** Ein Abschnitt ermöglicht es, die Farben der Kreise inkl. Nummern für **Komplexität**, **Aufwand**, **Unsicherheit**, **(BV) Anwender- und Geschäftswert**, **(TC) Zeitkritikalität**, **(RR/OE) Risikoreduzierung und/oder Chanceneröffnung** und den äußeren Kreis der Visualisierungen über den Farbwähler anzupassen.
* **Editor-Farben:** Die vier voreingestellten Farben, die im „Notizen & Annahmen“ Rich-Text-Editor verfügbar sind, können angepasst werden. Auch diese werden gespeichert/exportiert.
* **Einstellungen zurücksetzen:** Diese Schaltfläche setzt **alle** Optionen in diesem Dialog auf ihre ursprünglichen Standardwerte zurück.

## 12. Anwendung zurücksetzen

Wenn alle Daten vollständig gelöscht und neu gestartet werden sollen, kann die Schaltfläche **"Anwendung zurücksetzen"** (im Kopfbereich) verwendet werden.

* Diese Aktion führt einen **Factory Reset** durch: Sie löscht alle Backlog Items, entfernt alle benutzerdefinierten Einstellungen und löscht alle im Local Storage des Browsers gespeicherten Daten.
* **Warnung:** Diese Aktion ist irreversibel. Die Anwendung fordert vor der Bestätigung der Löschung dazu auf, die Daten als JSON-Backup zu **exportieren**.

## 13. Informationen und Updates

Ein Klick auf das **Info-Symbol („i“)** zeigt Details zur Softwareversion, Kontaktinformationen und die Softwarelizenz an. Dieser Dialog enthält auch eine **Update-Prüfung**.
Die Anwendung prüft automatisch, ob eine neue Version verfügbar ist, und zeigt eine Benachrichtigungsleiste am oberen Browser-Rand an, wenn ein Update gefunden wird.
Ein Klick auf das **Hilfe-Symbol („?“)** öffnet dieses Benutzerhandbuch in einem neuen Browser-Tab.

-----

# FAQ

## F: Warum fehlt SizeRight die API-Integration zu Enterprise-Tools?

**A:** SizeRight ist als fokussiertes, sitzungsbasiertes Werkzeug konzipiert und nicht als integrierte Enterprise-Plattform. Der Arbeitsablauf ist beabsichtigt: Ein Moderator gibt die **Backlog Items** vor oder während der Sitzung ein. Das Tool schafft eine visuelle Umgebung, um **Relative Schätzung** und Diskussionen zu ermöglichen. Sobald der **Arbeitsumfang (Job Size)** und die **Verzögerungskosten (Cost of Delay)** bestimmt sind und die Planungssession beendet ist, werden die Ergebnisse über einen **CSV Export** exportiert. Diese Datei wird dann verwendet, um Ihr primäres System of Record (Führendes System) zu aktualisieren.

## F: Ist die Mathematik hinter der Berechnung zuverlässig?

**A:** Die Anwendung beansprucht keine absolute mathematische Präzision (z.B.: Stunden oder Tage). Stattdessen folgt sie streng den Prinzipien der **Relativen Schätzung**. Um die Genauigkeit innerhalb dieses relativen Rahmens zu gewährleisten, unterstützt SizeRight die Definition von **Referenz-Items** (Min/Max). Dies ermöglicht es dem Team, neue Items gegen bekannte Referenzwert zu **triangulieren**, um sicherzustellen, dass die Beziehungen zwischen den Items konsistent und für die Priorisierung gültig sind.

## F: Warum sind die Skalen auf einen Maximalwert von 8 begrenzt?

**A:** SizeRight nutzt **Relative Schätzung**, was bedeutet, dass ein Wert von 8 eine Größenordnung darstellt, die **8x größer** ist als ein Wert von **1**. Da dieses Tool auf strategische **Backlog Items** (wie Features oder Epics) abzielt, ist es unrealistisch, dass ein einzelnes Item mehr als 8-mal größer ist als das kleinste Referenz-Item. Wenn ein Item dieses Verhältnis überschreitet, deutet dies normalerweise darauf hin, dass das Item in kleinere Teile **aufgeteilt (gesplittet)** werden muss. Umgekehrt, wenn diese häufig an die Obergrenze stoßen, kann dies darauf hindeuten, dass das Referenzwert-Item (der Wert 1) zu granular geschnitten ist (z.B.: Schätzung von Tasks statt Features). Darüber hinaus kann der kombinierte Wert für **Arbeitsumfang (Job Size)** oder **Verzögerungskosten (Cost of Delay)** bis zu 24 Einheiten erreichen. Die Verwendung der **Fibonacci-Skala** (1, 2, 3, 5, 8) verhindert „falsche Präzision“ indem "erzwungen" wird, dass Schätzungen mit zunehmender Unsicherheit in größere Kategorien (**Buckets**) einsortiert werden.

## F: Warum erfordert die Anwendung eine hohe Bildschirmauflösung?

**A:** SizeRight ist für eine Auflösung von 1920x1080 oder höher optimiert, um als **Visual Radiator** auf einem großen Monitor oder Beamer im Besprechungsraum zu dienen. Es ist so konzipiert, dass es das „Big Picture“ zeigt - einschließlich **Bubble-Charts**, **WSJF**-Ranglisten und der **Tabelle für relative Schätzung** nebeneinander, um Gruppendiskussionen zu erleichtern. Dies ist auch der Grund, warum die Software explizit **nicht responsiv** oder für mobile Geräte optimiert ist. Der Kernnutzen des Werkezugs liegt in dieser gleichzeitigen Gegenüberstellung von Daten; eine Anpassung des Layouts für kleinere Bildschirme würde diese Vergleichbarkeit nicht gewährleisten und damit den primären Nutzen von SizeRight zunichtemachen.

## F: Sind meine Daten sicher? Werden sie an einen Server gesendet?

**A:** SizeRight arbeitet vollständig als clientseitige Anwendung in Ihrem Browser. Es werden keine Daten an einen externen Server oder Cloud-Dienst übertragen. Die **Backlog Items** werden vorübergehend im lokalen Speicher Ihres Browsers (LocalStorage) abgelegt, ausschließlich zur Sitzungspersistenz. Sie behalten die volle Kontrolle über Ihre Daten durch die lokale **JSON/CSV Export**-Funktionalität. Da es sich zudem um **Open Source**-Software handelt, ist der Quellcode vollständig transparent und kann geprüft und auch modifiziert werden. Das Tool besteht aus einer einzigen, leichtgewichtigen Datei, was eine einfache Verteilung und maximale Kompatibilität mit nahezu jedem Browser der letzten Jahre gewährleistet. Diese Architektur eliminiert externe Abhängigkeiten und macht den Einsatz auch in Hochsicherheitsumgebungen mit strengen Compliance-Anforderungen sicher.

## F: Warum „Bubble-Charts“ statt einer einfachen Tabellenkalkulation?

**A:** Um das Ziel „**Align fast**“ zu erreichen, ist die visuelle Wahrnehmung schneller als das Verarbeiten von Zahlen. Die **Bubble-Charts** ermöglichen es dem Team, sofort zu erkennen, *warum* ein **Arbeitsumfang (Job Size)** groß ist (z.B.: geringer **Aufwand**, aber massive **Unsicherheit**). Diese Visualisierung deckt versteckte Annahmen auf und treibt die Konversation effektiver voran als eine tabellarische Liste.

## F: Wie priorisieren wir Arbeiten an der Architektur oder „Enabler“ gegenüber Business-Features?

**A:** Nutzen Sie die Skala **RR/OE** (Risikoreduzierung und/oder Chanceneröffnung) innerhalb der Schätzung der **Verzögerungskosten (Cost of Delay)**. Diese Komponente stellt sicher, dass technische Items, wie Infrastruktur-Updates oder Sicherheits-Fixes, einen quantifizierten wirtschaftlichen Wert erhalten. Dies ermöglicht es ihnen, fair um die **WSJF**-Priorität gegen Standard-Features zu konkurrieren, die auf **Anwender- und Geschäftswert** basieren.

## F: Wie werden Daten persistiert/temporär gespeichert und was passiert, wenn der Browser abstürzt?

**A:** Die Datenpersistenz im lokalen Speicher des Browsers dient einem einzigen, sicherheitskritischen Zweck: Datenverlust im Falle einer versehentlichen Aktualisierung der Seite (Page Refresh) während einer Live-Sitzung zu verhindern. Sie ist **nicht** für die Langzeitarchivierung oder historische Dokumentation gedacht. Zum Speichern des Fortschritts oder zum Teilen von Ergebnissen sollten Benutzer die **Export**-Funktionalität (JSON/CSV) nutzen.

