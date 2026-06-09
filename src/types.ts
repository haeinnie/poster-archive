/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Poster {
  id: string;
  title: string;
  subtitle: string;
  designer: string;
  week: string; // 제작 주차 (e.g. "12" or "WEEK 12")
  subject: string; // 주제
  description: string;
  imageUrl: string; // 메인 포스터 이미지 (우선 한 장)
  additionalImages?: string[]; // 추가로 삽입하는 다른 여러 포스터 이미지들
  category: 'graphic';
  createdAt: string;
}
